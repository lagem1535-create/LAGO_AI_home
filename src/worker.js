// LAGO AI — Cloudflare Worker
// 정적 파일(public/)은 Workers Assets가 내보내고, /api/* 만 이 코드가 처리해요.
// 시크릿(대시보드 또는 `npx wrangler secret put 이름`으로 넣기):
//   FIREBASE_CONFIG  — Firebase 웹 앱 설정 JSON 한 줄 (예: {"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."})
//   DATA_GO_KR_KEY   — 공공데이터포털(data.go.kr) 일반 인증키 (Decoding 키)
//   RESEND_API_KEY   — (선택) 보호자 이메일 알림용 Resend API 키. 없으면 이메일은 안 보내요.
//   MAIL_FROM        — (선택) 보내는 사람. 기본값 "LAGO <onboarding@resend.dev>" (이 주소는 Resend 가입 이메일에만 보낼 수 있어요)
// 키는 브라우저로 내려보내지 않아요. 공공데이터 호출은 이 Worker가 대신 해요.

const UA = "LAGO-AI/0.1 (https://lago-ai-home.lagem1535.workers.dev)";

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

function readFirebase(env) {
  if (!env.FIREBASE_CONFIG) return null;
  try {
    const c = JSON.parse(env.FIREBASE_CONFIG);
    // 웹 앱에 필요한 값만 골라서 내려보내요.
    const keep = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId", "measurementId"];
    return Object.fromEntries(keep.filter((k) => c[k]).map((k) => [k, c[k]]));
  } catch {
    return { error: "FIREBASE_CONFIG가 올바른 JSON이 아니에요" };
  }
}

// ---------- 위키백과 (키 필요 없음) ----------
async function wiki(q) {
  const base = "https://ko.wikipedia.org";
  const h = { "user-agent": UA, accept: "application/json" };
  // 1) 검색해서 가장 알맞은 문서 제목 찾기
  const s = await fetch(
    `${base}/w/api.php?action=query&list=search&format=json&srlimit=3&utf8=1&srsearch=${encodeURIComponent(q)}`,
    { headers: h, cf: { cacheTtl: 3600 } }
  );
  if (!s.ok) throw new Error("wiki search " + s.status);
  const hits = (await s.json())?.query?.search || [];
  if (!hits.length) return { found: false, q };
  // 2) 문서 요약 가져오기
  const out = [];
  for (const hit of hits.slice(0, 2)) {
    const r = await fetch(`${base}/api/rest_v1/page/summary/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`, {
      headers: h,
      cf: { cacheTtl: 3600 },
    });
    if (!r.ok) continue;
    const d = await r.json();
    out.push({ title: d.title, extract: d.extract, url: d.content_urls?.desktop?.page || `${base}/wiki/${encodeURIComponent(hit.title)}` });
  }
  return { found: out.length > 0, q, results: out };
}

// ---------- 공공데이터포털 예시: 한국천문연구원 특일 정보(공휴일) ----------
// 활용 신청: data.go.kr 에서 "한국천문연구원_특일 정보" 검색 → 활용신청
async function holidays(env, year, month) {
  if (!env.DATA_GO_KR_KEY) return json({ error: "DATA_GO_KR_KEY 시크릿이 없어요" }, 503);
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) return json({ error: "year=YYYY&month=M 형식으로 보내 주세요" }, 400);
  const u = new URL("https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo");
  u.searchParams.set("serviceKey", env.DATA_GO_KR_KEY);
  u.searchParams.set("solYear", year);
  u.searchParams.set("solMonth", String(month).padStart(2, "0"));
  u.searchParams.set("_type", "json");
  u.searchParams.set("numOfRows", "50");
  const r = await fetch(u, { headers: { "user-agent": UA }, cf: { cacheTtl: 86400 } });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "공공데이터 응답이 JSON이 아니에요 (키 또는 활용신청을 확인해 주세요)", raw: text.slice(0, 300) }, 502); }
  let items = data?.response?.body?.items?.item || [];
  if (!Array.isArray(items)) items = [items];
  return json({
    source: "공공데이터포털 · 한국천문연구원 특일 정보",
    year, month,
    items: items.map((i) => ({ date: String(i.locdate), name: i.dateName, holiday: i.isHoliday === "Y" })),
  }, 200, { "cache-control": "public, max-age=3600" });
}

// ---------- 보호자 이메일 알림 ----------
// 로그인한 본인 이메일(구글 계정 이메일)로만 보내요. 남에게 보내는 스팸 통로로 쓰이지 않게
// Firebase ID 토큰을 확인하고, 토큰에 들어 있는 이메일에게만 보내요.
async function notify(req, env, url, ctx) {
  if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY 시크릿이 없어요" }, 503);
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  let apiKey;
  try { apiKey = JSON.parse(env.FIREBASE_CONFIG).apiKey; } catch { return json({ error: "FIREBASE_CONFIG가 없어요" }, 503); }
  if (!tok || !apiKey) return json({ error: "로그인이 필요해요" }, 401);
  const lk = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: tok }),
  });
  if (!lk.ok) return json({ error: "로그인 확인에 실패했어요" }, 401);
  const u = (await lk.json())?.users?.[0];
  if (!u?.email) return json({ error: "이메일이 없는 계정이에요" }, 403);
  if (!u.emailVerified) return json({ error: "이메일 인증 뒤에 알림을 받을 수 있어요" }, 403);
  let b = {};
  try { b = await req.json(); } catch {}
  const who = String(b.kid || "아이").slice(0, 20);
  const reason = String(b.reason || "").slice(0, 60);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM || "LAGO <onboarding@resend.dev>",
      to: [u.email],
      subject: `[LAGO] ${who}가 시간을 더 요청했어요`,
      text: `${who}가 오늘 LAGO를 30분 더 쓰고 싶어 해요.${reason ? `\n이유: ${reason}` : ""}\n\nLAGO → 보호자 화면에서 허락하거나 거절할 수 있어요.\n${url.origin}/#guardian`,
    }),
  });
  bump(env, ctx, r.ok ? "mailSent" : "mailFail");
  return r.ok ? json({ ok: true }) : json({ error: "메일을 보내지 못했어요" }, 502);
}

// ---------- 아이 가입: 보호자 동의 요청 메일 ----------
// 아이는 아직 계정이 없어서 로그인 없이 호출돼요. 그래서 메일 내용은 고정 문구로만 보내고
// (아이가 글을 끼워 넣을 수 없어요), 같은 주소 · 같은 IP로 너무 자주 보내지 못하게 막아요.
// 이 제한은 서버 한 대의 메모리 기준이라 완벽하지 않아요. 공개 전에 Cloudflare Turnstile(봇 확인)을 붙이는 걸 권해요.
const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now();
  const a = (hits.get(key) || []).filter((t) => now - t < ms);
  if (a.length >= max) { hits.set(key, a); return true; }
  a.push(now); hits.set(key, a);
  if (hits.size > 5000) hits.clear();
  return false;
}
async function kidConsent(req, env, url, ctx) {
  if (!env.RESEND_API_KEY) return json({ error: "메일 보내기가 아직 준비되지 않았어요" }, 503);
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  let b = {};
  try { b = await req.json(); } catch {}
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return json({ error: "보호자 이메일 주소를 확인해 주세요." }, 400);
  const ip = req.headers.get("cf-connecting-ip") || "?";
  if (limited("ip:" + ip, 5, 3600e3) || limited("to:" + email, 1, 3600e3))
    return json({ error: "방금 요청을 보냈어요. 1시간 뒤에 다시 보낼 수 있어요." }, 429);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM || "LAGO <onboarding@resend.dev>",
      to: [email],
      subject: "[LAGO] 자녀가 LAGO Goccia 가입에 보호자 동의를 요청했어요",
      text: [
        "안녕하세요, LAGO예요.",
        "",
        "만 14세 미만 자녀가 LAGO Goccia(어린이 계정) 가입을 위해 보호자 동의를 요청했어요.",
        "동의하시면 보호자 계정으로 로그인한 뒤 보호자 화면에서 진행할 수 있어요.",
        "",
        "· 보호자에게는 사용 시간, 주제 요약, 안전 알림만 보여요. 대화 내용은 보이지 않아요.",
        "· 7일 안에 동의하지 않으면 이 이메일 주소와 임시 정보는 지워져요.",
        "· 어린이 계정은 2027년 1월부터 열려요.",
        "",
        "직접 요청하신 적이 없다면 이 메일은 무시하셔도 돼요.",
        "",
        url.origin + "/#login",
      ].join("\n"),
    }),
  });
  bump(env, ctx, r.ok ? "mailSent" : "mailFail");
  return r.ok ? json({ ok: true }) : json({ error: "메일을 보내지 못했어요. 이메일 주소를 확인해 주세요." }, 502);
}

// ---------- 관리자 ----------
// 관리자(ADMIN_EMAIL, 기본 lagem1535@gmail.com)가 로그인하면 /#admin 에서 키를 넣고 사용량을 볼 수 있어요.
// 키는 Workers KV(ADMIN_KV)에 저장해요. 대시보드의 시크릿이 있으면 그쪽이 우선이에요.
// FIREBASE_CONFIG는 로그인 확인에 쓰이는 값이라 여기서 바꾸지 못하고 대시보드에서만 넣어요.
const ADMIN_DEFAULT = "lagem1535@gmail.com";
const SECRET_NAMES = ["RESEND_API_KEY", "MAIL_FROM", "DATA_GO_KR_KEY"];
const STAT_NAMES = ["visits", "wiki", "holidays", "kidConsent", "notify", "mailSent", "mailFail"];

let secCache = { at: 0, v: {} };
async function withSecrets(env) {
  if (!env.ADMIN_KV) return env;
  if (Date.now() - secCache.at > 15000) {
    const v = {};
    await Promise.all(SECRET_NAMES.map(async (n) => { try { const x = await env.ADMIN_KV.get("secret:" + n); if (x) v[n] = x; } catch {} }));
    secCache = { at: Date.now(), v };
  }
  const o = { ...env };
  for (const n of SECRET_NAMES) if (!env[n] && secCache.v[n]) o[n] = secCache.v[n];
  return o;
}
const day = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); // 한국 날짜
function bump(env, ctx, name) {
  if (!env.ADMIN_KV || !ctx) return;
  const k = `stat:${day()}:${name}`;
  ctx.waitUntil((async () => {
    try { const n = parseInt((await env.ADMIN_KV.get(k)) || "0", 10) + 1; await env.ADMIN_KV.put(k, String(n), { expirationTtl: 60 * 86400 }); } catch {}
  })());
}
async function adminAuth(req, env, url) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return { err: json({ error: "허용되지 않은 요청이에요" }, 403) };
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  let apiKey;
  try { apiKey = JSON.parse(env.FIREBASE_CONFIG).apiKey; } catch { return { err: json({ error: "FIREBASE_CONFIG가 없어요" }, 503) }; }
  if (!tok) return { err: json({ error: "로그인이 필요해요" }, 401) };
  const lk = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: tok }),
  });
  if (!lk.ok) return { err: json({ error: "로그인 확인에 실패했어요" }, 401) };
  const u = (await lk.json())?.users?.[0];
  const admin = String(env.ADMIN_EMAIL || ADMIN_DEFAULT).toLowerCase();
  if (!u?.email || !u.emailVerified || u.email.toLowerCase() !== admin) return { err: json({ error: "관리자만 볼 수 있어요" }, 403) };
  return { email: u.email };
}
function hint(v) { return v ? (v.length > 10 ? "…" + v.slice(-4) : "설정됨") : ""; }
async function adminStatus(env, raw) {
  const secrets = {};
  for (const n of SECRET_NAMES) {
    const fromEnv = !!raw[n];
    const kv = env.ADMIN_KV ? await env.ADMIN_KV.get("secret:" + n) : null;
    secrets[n] = { set: fromEnv || !!kv, source: fromEnv ? "dashboard" : kv ? "admin" : null, hint: hint(raw[n] || kv || ""), canEdit: !!env.ADMIN_KV && !fromEnv };
  }
  const days = [];
  if (env.ADMIN_KV) {
    for (let i = 0; i < 14; i++) {
      const d = day(new Date(Date.now() - i * 86400e3));
      const row = { date: d };
      await Promise.all(STAT_NAMES.map(async (n) => { row[n] = parseInt((await env.ADMIN_KV.get(`stat:${d}:${n}`)) || "0", 10); }));
      days.push(row);
    }
  }
  return { kv: !!env.ADMIN_KV, firebase: !!raw.FIREBASE_CONFIG, secrets, days };
}
async function adminApi(req, env, ctx, url, raw) {
  const a = await adminAuth(req, raw, url);
  if (a.err) return a.err;
  const p = url.pathname;
  if (p === "/api/admin/status" && req.method === "GET") return json({ email: a.email, ...(await adminStatus(env, raw)) });
  if (req.method !== "POST") return json({ error: "POST만 돼요" }, 405);
  let b = {};
  try { b = await req.json(); } catch {}
  if (p === "/api/admin/secret" || p === "/api/admin/secret/delete") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const n = String(b.name || "");
    if (!SECRET_NAMES.includes(n)) return json({ error: "바꿀 수 없는 이름이에요" }, 400);
    if (p.endsWith("/delete")) await env.ADMIN_KV.delete("secret:" + n);
    else {
      const v = String(b.value || "").trim();
      if (!v || v.length > 500) return json({ error: "값을 확인해 주세요" }, 400);
      await env.ADMIN_KV.put("secret:" + n, v);
    }
    secCache.at = 0;
    return json({ ok: true });
  }
  if (p === "/api/admin/test-mail") {
    if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY가 아직 없어요" }, 400);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM || "LAGO <onboarding@resend.dev>", to: [a.email], subject: "[LAGO] 테스트 메일", text: "관리자 페이지에서 보낸 테스트 메일이에요. 이 메일이 보이면 메일 보내기가 잘 되는 거예요." }),
    });
    const t = await r.text();
    bump(env, ctx, r.ok ? "mailSent" : "mailFail");
    return r.ok ? json({ ok: true }) : json({ error: "Resend 응답: " + t.slice(0, 200) }, 502);
  }
  return json({ error: "없는 주소예요" }, 404);
}

export default {
  async fetch(req, rawEnv, ctx) {
    const raw = rawEnv;
    const env = await withSecrets(rawEnv);
    const url = new URL(req.url);
    const p = url.pathname;
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      if (p.startsWith("/api/admin/")) return await adminApi(req, env, ctx, url, raw);
      if (p === "/api/kid-consent") return req.method === "POST" ? (bump(env, ctx, "kidConsent"), await kidConsent(req, env, url, ctx)) : json({ error: "POST만 돼요" }, 405);
      if (p === "/api/notify") return req.method === "POST" ? (bump(env, ctx, "notify"), await notify(req, env, url, ctx)) : json({ error: "POST만 돼요" }, 405);
      if (req.method !== "GET") return json({ error: "GET만 돼요" }, 405);
      if (p === "/api/config") {
        bump(env, ctx, "visits");
        return json({
          firebase: readFirebase(env),
          publicData: !!env.DATA_GO_KR_KEY,
          mail: !!env.RESEND_API_KEY,
          wiki: true,
        });
      }
      if (p === "/api/wiki") {
        const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
        if (!q) return json({ error: "q가 필요해요" }, 400);
        bump(env, ctx, "wiki");
        return json(await wiki(q), 200, { "cache-control": "public, max-age=600" });
      }
      if (p === "/api/holidays") {
        bump(env, ctx, "holidays");
        const now = new Date();
        return await holidays(env, url.searchParams.get("year") || String(now.getFullYear()), url.searchParams.get("month") || String(now.getMonth() + 1));
      }
      return json({ error: "없는 주소예요" }, 404);
    } catch (e) {
      return json({ error: "서버 오류", detail: String(e.message || e) }, 500);
    }
  },
};
