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
// 질문에서 주제어만 뽑기: "독도는 어디에 있어?" -> "독도"
function topicOf(q) {
  let t = String(q).replace(/[?？!.,~"'`]/g, " ");
  t = t.replace(/(은|는|이|가|을|를|의|에|에서|에게|도|만)?\s*(어디(에)?\s*(있어|있나요|있니|있는지|야|예요|인가요)?|누구(야|예요|인가요|니)?|누가\s*만들었(어|나요|니)?|언제(야|예요|인가요|였어|였나요)?|뭐(야|예요|가\s*뭐야)?|무엇(인가요|이에요|입니까)?|뭔가요|몇\s*(살|개|명)?(이야|인가요)?|왜(야|그래)?|어떻게\s*(돼|되나요|해|하나요)?|알려\s*줘(요)?|설명해\s*줘(요)?|쉽게|자세히|대해(서)?\s*(알려\s*줘|설명해\s*줘|말해\s*줘)?|궁금해(요)?|이란|란|에\s*대해)/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/(은|는|이|가|을|를|의)$/, "").trim();
  return t || String(q).trim();
}
const META = /^(이 (문서|항목|글)|본 (문서|항목)|다음은|다음 문서|이 문서에서는|.*(문서|항목)(에서는|는|은)\s.*(정리|서술|다룬))/;
function cleanExtract(txt) {
  const sents = String(txt || "").split(/(?<=[.다요])\s+/).filter((x) => x && !META.test(x.trim()));
  return sents.join(" ").trim();
}
async function wiki(q0) {
  const base = "https://ko.wikipedia.org";
  const h = { "user-agent": UA, accept: "application/json" };
  const q = topicOf(q0);
  const sum = async (title) => {
    const r = await fetch(`${base}/api/rest_v1/page/summary/${encodeURIComponent(String(title).replace(/ /g, "_"))}?redirect=true`, { headers: h, cf: { cacheTtl: 3600 } });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || d.type === "disambiguation" || d.type === "no-extract") return null;
    const ex = cleanExtract(d.extract);
    if (!ex) return null;
    return { title: d.title, extract: ex, url: d.content_urls?.desktop?.page || `${base}/wiki/${encodeURIComponent(d.title)}` };
  };
  const out = [];
  const seen = new Set();
  const push = (x) => { if (x && !seen.has(x.title)) { seen.add(x.title); out.push(x); } };
  // 1) 주제어와 이름이 같은 문서를 먼저
  try { push(await sum(q)); } catch {}
  // 2) 검색 결과 중 주제어와 관련 있는 것만 (제목에 주제어 포함, 또는 문서 앞부분에 주제어 언급)
  const s = await fetch(
    `${base}/w/api.php?action=query&list=search&format=json&srlimit=5&utf8=1&srsearch=${encodeURIComponent(q)}`,
    { headers: h, cf: { cacheTtl: 3600 } }
  );
  if (!s.ok && !out.length) throw new Error("wiki search " + s.status);
  const hits = s.ok ? (await s.json())?.query?.search || [] : [];
  const words = q.split(/\s+/).filter((w) => w.length > 0);
  const relevant = (hit) => words.some((w) => hit.title.toLowerCase().includes(w.toLowerCase()));
  for (const hit of hits.filter(relevant)) {
    if (out.length >= 3) break;
    try { push(await sum(hit.title)); } catch {}
  }
  return { found: out.length > 0, q, topic: q, results: out.slice(0, 3) };
}


// ---------- Fonte(FACT) 답변: 위키백과에서 찾은 참고자료 + 학습된 모델 ----------
// 모델은 캐글/GPU 서버에서 따로 돌고(MODEL_URL), 여기서는 참고자료를 붙여 보내고 답을 받아 와요.
const FACT_SYS = "[MODE:FACT] 너는 LAGO AI다. 참고자료에 근거해서 답하고, 근거 번호를 [1]처럼 붙여라. " +
  "자료에 없어도 누구나 아는 일반 상식이면 짧게 답하고 끝에 '(일반 상식, 출처 없음)'을 붙여라. " +
  "특정 인물·숫자·날짜·사건·최신 정보처럼 확인이 필요한 내용이 자료에 없으면 " +
  "'제공된 자료에는 해당 내용이 없습니다'라고 답하라. URL을 직접 쓰지 마라."; // fact_2·fact_5의 SYS_FACT와 똑같이 둘 것 (학습한 형식)
const CHAT_DAILY = 50;
async function chat(req, env, url, ctx) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  if (!env.MODEL_URL || !env.MODEL_KEY) return json({ error: "모델이 아직 연결되지 않았어요", noModel: true }, 503);
  const u = await tokenUser(req, env);
  if (!u) return json({ error: "로그인이 필요해요" }, 401);
  const isAdmin = String(u.email || "").toLowerCase() === String(env.ADMIN_EMAIL || ADMIN_DEFAULT).toLowerCase() && !!u.emailVerified;
  if (saOf(env) && !isAdmin) {
    const m = await getMod(env, u.localId);
    if (m.banned || (m.tempBan && (m.bannedUntil || 0) > Date.now())) return json({ error: "사용이 제한된 계정이에요" }, 403);
  }
  let b = {}; try { b = await req.json(); } catch {}
  const q = String(b.q || "").trim().slice(0, 500);
  if (!q) return json({ error: "질문을 적어 주세요" }, 400);
  if (env.ADMIN_KV && !isAdmin) {
    const k = `chat:${u.localId}:${day()}`;
    const n = parseInt((await env.ADMIN_KV.get(k)) || "0", 10);
    if (n >= CHAT_DAILY) return json({ error: `하루 ${CHAT_DAILY}번까지 물어볼 수 있어요`, limit: true }, 429);
    await env.ADMIN_KV.put(k, String(n + 1), { expirationTtl: 172800 });
  }
  bump(env, ctx, "chat");
  let refs = [];
  try { refs = (await wiki(q)).results || []; } catch {}
  const ctxText = refs.length ? refs.map((x, i) => `[${i + 1}] [${x.title}] ${String(x.extract).slice(0, 700)}`).join("\n") : "(없음)";
  const user = `참고자료:\n${ctxText}\n\n질문: ${q}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 90000);
  try {
    const r = await fetch(env.MODEL_URL + "/generate", {
      method: "POST", signal: ac.signal,
      headers: { "content-type": "application/json", "x-key": env.MODEL_KEY, "user-agent": UA },
      body: JSON.stringify({ system: FACT_SYS, user, max_new_tokens: 400 }),
    });
    if (!r.ok) return json({ error: "모델이 응답하지 못했어요 (" + r.status + ")", modelDown: true }, 502);
    const d = await r.json();
    let ans = String(d.answer || "").replace(/https?:\/\/\S+/g, "(링크 확인 불가)").trim().slice(0, 2000);
    if (!ans) return json({ error: "빈 답이 왔어요", modelDown: true }, 502);
    const cited = [...new Set([...ans.matchAll(/\[(\d)\]/g)].map((m) => +m[1]))].filter((n) => n >= 1 && n <= refs.length);
    return json({ answer: ans, sources: cited.map((n) => ({ n, title: refs[n - 1].title, url: refs[n - 1].url })), refs: refs.length });
  } catch (e) {
    return json({ error: "모델 서버에 연결하지 못했어요", modelDown: true }, 502);
  } finally { clearTimeout(t); }
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
  if (saOf(env)) { const m = await getMod(env, u.localId); if (m.banned || (m.tempBan && m.bannedUntil > Date.now())) return json({ error: "이용이 정지된 계정이에요" }, 403); }
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

// ---------- Firebase 관리 (서비스 계정) ----------
// 유저 목록, 정지, 요금제/한도 바꾸기에 써요. Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성"으로 받은 JSON을
// 시크릿 FIREBASE_SERVICE_ACCOUNT 에 넣어요(대시보드 또는 관리자 화면).
// 정지 정보는 Firestore의 mod/{uid} 문서에 둬요. 이 문서는 서비스 계정만 쓸 수 있어서 유저가 스스로 풀 수 없어요.
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uStr = (s) => b64u(new TextEncoder().encode(s));
let gTok = { v: "", exp: 0, key: "" };
function saOf(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return null;
  try { const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); return sa.client_email && sa.private_key && sa.project_id ? sa : null; } catch { return null; }
}
async function gToken(env) {
  const sa = saOf(env);
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT가 없거나 올바르지 않아요");
  if (gTok.v && gTok.key === sa.client_email && Date.now() < gTok.exp - 60000) return gTok.v;
  const now = Math.floor(Date.now() / 1000);
  const head = b64uStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64uStr(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + claim)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + head + "." + claim + "." + sig,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("구글 인증에 실패했어요: " + (j.error_description || j.error || r.status));
  gTok = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000, key: sa.client_email };
  return gTok.v;
}
async function gfetch(env, url, init = {}) {
  const t = await gToken(env);
  const r = await fetch(url, { ...init, headers: { authorization: "Bearer " + t, "content-type": "application/json", ...(init.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || "요청 실패 " + r.status);
  return j;
}
const fsEnc = (v) => v === null || v === undefined ? { nullValue: null } : typeof v === "boolean" ? { booleanValue: v } : typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : { stringValue: String(v) };
const fsDec = (f) => { if (!f) return null; if ("stringValue" in f) return f.stringValue; if ("integerValue" in f) return Number(f.integerValue); if ("doubleValue" in f) return f.doubleValue; if ("booleanValue" in f) return f.booleanValue; return null; };
const fsObj = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fsDec(v)]));
const fsBase = (sa) => `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
async function fsBatch(env, paths, mask) {
  const sa = saOf(env); const out = {};
  for (let i = 0; i < paths.length; i += 100) {
    const part = paths.slice(i, i + 100);
    const body = { documents: part.map((p) => `projects/${sa.project_id}/databases/(default)/documents/${p}`) };
    if (mask) body.mask = { fieldPaths: mask };
    const res = await gfetch(env, fsBase(sa) + ":batchGet", { method: "POST", body: JSON.stringify(body) });
    for (const x of res) if (x.found) out[x.found.name.split("/documents/")[1]] = fsObj(x.found.fields);
  }
  return out;
}
async function fsSetDoc(env, path, obj) {
  const sa = saOf(env);
  const fields = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fsEnc(v)]));
  await gfetch(env, `${fsBase(sa)}/${path}`, { method: "PATCH", body: JSON.stringify({ fields }) });
}
async function getMod(env, uid) {
  try { return (await fsBatch(env, ["mod/" + uid]))["mod/" + uid] || {}; } catch { return {}; }
}
async function authUpdate(env, body) {
  const sa = saOf(env);
  return gfetch(env, `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:update`, { method: "POST", body: JSON.stringify(body) });
}
// 기간 정지가 끝난 계정을 다시 열어요. 크론(10분마다)과 관리자 목록을 열 때 실행돼요.
async function sweep(env) {
  const sa = saOf(env);
  if (!sa) return 0;
  const res = await gfetch(env, fsBase(sa) + ":runQuery", {
    method: "POST",
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "mod" }], where: { fieldFilter: { field: { fieldPath: "tempBan" }, op: "EQUAL", value: { booleanValue: true } } }, limit: 200 } }),
  });
  let n = 0;
  for (const row of res) {
    if (!row.document) continue;
    const m = fsObj(row.document.fields), uid = row.document.name.split("/").pop();
    if (m.bannedUntil && m.bannedUntil <= Date.now()) {
      await authUpdate(env, { localId: uid, disableUser: false });
      await fsSetDoc(env, "mod/" + uid, { ...m, tempBan: false, bannedUntil: 0, reason: "", updated: Date.now() });
      n++;
    }
  }
  return n;
}
async function listUsers(env) {
  const sa = saOf(env);
  const users = [];
  let page = "";
  for (let i = 0; i < 3; i++) {
    const j = await gfetch(env, `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:batchGet?maxResults=200${page ? "&nextPageToken=" + encodeURIComponent(page) : ""}`);
    users.push(...(j.users || []));
    if (!j.nextPageToken) break;
    page = j.nextPageToken;
  }
  const ids = users.map((u) => u.localId);
  const prof = await fsBatch(env, ids.map((x) => `users/${x}/data/main`), ["plan", "name"]); // 대화 내용은 읽지 않아요
  const mods = await fsBatch(env, ids.map((x) => "mod/" + x));
  return users.map((u) => {
    const p = prof[`users/${u.localId}/data/main`] || {}, m = mods["mod/" + u.localId] || {};
    return {
      uid: u.localId, email: u.email || "", name: p.name || u.displayName || "", verified: !!u.emailVerified,
      provider: (u.providerUserInfo || []).map((x) => x.providerId.replace(".com", "")).join(", "),
      created: Number(u.createdAt) || 0, lastLogin: Number(u.lastLoginAt) || 0,
      disabled: !!u.disabled, bannedUntil: m.bannedUntil || 0, banned: !!m.banned, reason: m.reason || "",
      plan: m.plan || "Free", planLocked: !!m.plan, // 유저가 직접 쓸 수 있는 문서의 값은 믿지 않아요 dailyLimit: m.dailyLimit || 0,
    };
  }).sort((a, b) => b.lastLogin - a.lastLogin);
}
async function userAction(env, adminEmail, b) {
  const uid = String(b.uid || "");
  if (!/^[A-Za-z0-9]{6,128}$/.test(uid)) return json({ error: "uid를 확인해 주세요" }, 400);
  const who = await authLookupUid(env, uid);
  if (!who) return json({ error: "없는 유저예요" }, 404);
  if (String(who.email || "").toLowerCase() === adminEmail.toLowerCase()) return json({ error: "관리자 본인은 바꿀 수 없어요" }, 400);
  const m = await getMod(env, uid);
  const act = String(b.action || "");
  const now = Date.now();
  if (act === "ban") {
    await authUpdate(env, { localId: uid, disableUser: true, validSince: String(Math.floor(now / 1000)) });
    await fsSetDoc(env, "mod/" + uid, { ...m, banned: true, tempBan: false, bannedUntil: 0, reason: String(b.reason || "").slice(0, 100), updated: now });
  } else if (act === "tempban") {
    const h = Number(b.hours);
    if (!(h > 0 && h <= 24 * 365)) return json({ error: "시간은 1~8760 사이로 넣어 주세요" }, 400);
    await authUpdate(env, { localId: uid, disableUser: true, validSince: String(Math.floor(now / 1000)) });
    await fsSetDoc(env, "mod/" + uid, { ...m, banned: false, tempBan: true, bannedUntil: now + Math.round(h * 3600e3), reason: String(b.reason || "").slice(0, 100), updated: now });
  } else if (act === "unban") {
    await authUpdate(env, { localId: uid, disableUser: false });
    await fsSetDoc(env, "mod/" + uid, { ...m, banned: false, tempBan: false, bannedUntil: 0, reason: "", updated: now });
  } else if (act === "plan") {
    const pl = String(b.plan || "");
    if (pl && !["Free", "Pro", "Max"].includes(pl)) return json({ error: "요금제를 확인해 주세요" }, 400);
    await fsSetDoc(env, "mod/" + uid, { ...m, plan: pl, updated: now });
  } else if (act === "limit") {
    const n = Math.round(Number(b.dailyLimit) || 0);
    if (n < 0 || n > 1e9) return json({ error: "한도를 확인해 주세요" }, 400);
    await fsSetDoc(env, "mod/" + uid, { ...m, dailyLimit: n, updated: now });
  } else if (act === "logout") {
    await authUpdate(env, { localId: uid, validSince: String(Math.floor(now / 1000)) });
  } else return json({ error: "없는 작업이에요" }, 400);
  return json({ ok: true });
}
async function authLookupUid(env, uid) {
  const sa = saOf(env);
  const j = await gfetch(env, `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:lookup`, { method: "POST", body: JSON.stringify({ localId: [uid] }) });
  return (j.users || [])[0] || null;
}
// 로그인한 본인의 정지/요금제/한도를 알려줘요. 앱이 열릴 때마다 불러서 화면에 반영해요.
async function me(req, env, url) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  const u = await tokenUser(req, env);
  if (!u) return json({ error: "로그인이 필요해요" }, 401);
  const out = { admin: String(u.email || "").toLowerCase() === String(env.ADMIN_EMAIL || ADMIN_DEFAULT).toLowerCase() && !!u.emailVerified };
  if (out.admin) out.plan = "Max";
  if (saOf(env) && !out.admin) {
    const m = await getMod(env, u.localId);
    const until = m.bannedUntil || 0;
    if (m.banned || (m.tempBan && until > Date.now())) { out.banned = true; out.until = m.banned ? 0 : until; out.reason = m.reason || ""; }
    if (m.plan) out.plan = m.plan;
    if (m.dailyLimit) out.dailyLimit = m.dailyLimit;
  }
  return json(out);
}
async function tokenUser(req, env) {
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  let apiKey;
  try { apiKey = JSON.parse(env.FIREBASE_CONFIG).apiKey; } catch { return null; }
  if (!tok) return null;
  const lk = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: tok }),
  });
  if (!lk.ok) return null;
  return (await lk.json())?.users?.[0] || null;
}

// ---------- 예약 작업 (모델 없이: 위키백과·공공데이터로 찾은 답을 메일로) ----------
// 앱이 /api/tasks/sync 로 작업 목록을 보내면 Firestore tasks/{uid} 에 저장하고, 5분마다 도는 크론이 시간이 된 작업을 실행해요.
// 결과는 로그인한 본인(이메일 인증된) 주소로만 보내요.
const FAR = 4102444800000;
const WDN = ["월", "화", "수", "목", "금", "토", "일"];
function nextDue(t, tzo, from) {
  const [h, m] = String(t.time || "08:00").split(":").map(Number), off = tzo * 60000;
  const d = new Date(from - off);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  const want = t.freq === "weekly" ? (WDN.indexOf(t.day) + 1) % 7 : null;
  for (let i = 0; i < 9 && (d.getTime() <= from - off || (want !== null && d.getUTCDay() !== want)); i++) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime() + off;
}
async function answerText(env, q) {
  const kst = new Date(Date.now() + 9 * 3600e3);
  if (/오늘의\s*(지식|위키)/.test(q)) {
    const r = await fetch("https://ko.wikipedia.org/api/rest_v1/page/random/summary", { headers: { "user-agent": UA } });
    const d = await r.json();
    return `${d.title}\n\n${d.extract}\n\n${d.content_urls?.desktop?.page || ""}`;
  }
  if (/공휴일|휴일|쉬는\s*날|빨간\s*날/.test(q) && env.DATA_GO_KR_KEY) {
    const m = q.match(/(\d{1,2})\s*월/), y = q.match(/(20\d{2})\s*년/);
    const yy = y ? y[1] : String(kst.getUTCFullYear()), mm = m ? m[1] : String(kst.getUTCMonth() + 1);
    const j = await (await holidays(env, yy, mm)).json();
    if (!j.items) return "공휴일 정보를 가져오지 못했어요.";
    return `${yy}년 ${mm}월 공휴일\n\n` + (j.items.length ? j.items.map((i) => `· ${+i.date.slice(4, 6)}월 ${+i.date.slice(6)}일 ${i.name}`).join("\n") : "이 달에는 공휴일이 없어요.") + "\n\n출처: 공공데이터포털 · 한국천문연구원 특일 정보";
  }
  const r = await wiki(q);
  if (!r.found) return `“${q}”에 대해 위키백과에서 찾지 못했어요. 질문을 더 짧은 단어로 바꿔 보세요.`;
  const top = r.results[0];
  return `${top.title}\n\n${(top.extract || "").split(/(?<=[.다요])\s+/).slice(0, 3).join(" ")}\n\n출처: ${top.url}`;
}
async function tasksSync(req, env, url) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  if (!saOf(env) || !env.RESEND_API_KEY) return json({ error: "서버에서 예약 작업을 아직 쓸 수 없어요" }, 503);
  const u = await tokenUser(req, env);
  if (!u?.email) return json({ error: "로그인이 필요해요" }, 401);
  if (!u.emailVerified) return json({ error: "이메일 인증 뒤에 메일로 받을 수 있어요" }, 403);
  let b = {};
  try { b = await req.json(); } catch {}
  const tzo = Math.max(-840, Math.min(840, parseInt(b.tzo, 10) || 0));
  const old = (await fsBatch(env, ["tasks/" + u.localId]))["tasks/" + u.localId];
  let prev = [];
  try { prev = JSON.parse(old?.tasks || "[]"); } catch {}
  const now = Date.now();
  const list = (Array.isArray(b.tasks) ? b.tasks : []).slice(0, 10).map((t) => {
    const x = { id: String(t.id || "").slice(0, 30), name: String(t.name || "").slice(0, 30), prompt: String(t.prompt || "").slice(0, 300), freq: ["daily", "weekly", "once"].includes(t.freq) ? t.freq : "daily", day: WDN.includes(t.day) ? t.day : "월", time: /^\d{2}:\d{2}$/.test(t.time) ? t.time : "08:00", on: t.on !== false };
    const p = prev.find((q) => q.id === x.id);
    const same = p && p.freq === x.freq && p.day === x.day && p.time === x.time && p.on === x.on && old?.tzo === tzo;
    x.next = x.on ? (same && p.next ? p.next : nextDue(x, tzo, now)) : 0;
    if (p?.last) x.last = p.last;
    return x;
  }).filter((x) => x.id && x.prompt);
  const dues = list.filter((t) => t.on && t.next).map((t) => t.next);
  await fsSetDoc(env, "tasks/" + u.localId, { email: u.email, tzo, due: dues.length ? Math.min(...dues) : FAR, tasks: JSON.stringify(list), updated: now });
  return json({ ok: true, count: list.length });
}
async function runTasks(env, ctx) {
  const sa = saOf(env);
  if (!sa || !env.RESEND_API_KEY) return 0;
  const now = Date.now();
  let sent = 0;
  const res = await gfetch(env, fsBase(sa) + ":runQuery", {
    method: "POST",
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "tasks" }], where: { fieldFilter: { field: { fieldPath: "due" }, op: "LESS_THAN_OR_EQUAL", value: { integerValue: String(now) } } }, limit: 25 } }),
  });
  for (const row of res) {
    if (!row.document) continue;
    const uid = row.document.name.split("/").pop(), doc = fsObj(row.document.fields);
    let tasks = [];
    try { tasks = JSON.parse(doc.tasks || "[]"); } catch {}
    const mod = await getMod(env, uid);
    const banned = mod.banned || (mod.tempBan && mod.bannedUntil > now);
    for (const t of tasks) {
      if (!t.on || !t.next || t.next > now) continue;
      if (!banned) {
        if (sent >= 20) continue; // 한 번에 너무 많이 보내지 않아요. 다음 크론에서 이어서 보내요.
        let ok = false;
        try {
          const text = await answerText(env, t.prompt);
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST", headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
            body: JSON.stringify({ from: env.MAIL_FROM || "LAGO <onboarding@resend.dev>", to: [doc.email], subject: `[LAGO] 예약 작업 · ${t.name}`, text: `${text}\n\n—\n예약 작업 “${t.name}”의 결과예요. 끄거나 바꾸려면 LAGO → 예약 작업에서 바꿔 주세요.` }),
          });
          ok = r.ok;
        } catch {}
        sent++;
        bump(env, ctx, "taskRun");
        bump(env, ctx, ok ? "mailSent" : "mailFail");
        t.err = ok ? "" : "메일을 보내지 못했어요";
      }
      t.last = now;
      if (t.freq === "once") { t.on = false; t.next = 0; } else t.next = nextDue(t, doc.tzo || 0, now);
    }
    const dues = tasks.filter((t) => t.on && t.next).map((t) => t.next);
    await fsSetDoc(env, "tasks/" + uid, { email: doc.email, tzo: doc.tzo || 0, due: dues.length ? Math.min(...dues) : FAR, tasks: JSON.stringify(tasks), updated: now });
  }
  return sent;
}

// ---------- 관리자 ----------
// 관리자(ADMIN_EMAIL, 기본 lagem1535@gmail.com)가 로그인하면 /#admin 에서 키를 넣고 사용량을 볼 수 있어요.
// 키는 Workers KV(ADMIN_KV)에 저장해요. 대시보드의 시크릿이 있으면 그쪽이 우선이에요.
// FIREBASE_CONFIG는 로그인 확인에 쓰이는 값이라 여기서 바꾸지 못하고 대시보드에서만 넣어요.
const ADMIN_DEFAULT = "lagem1535@gmail.com";
const SECRET_NAMES = ["RESEND_API_KEY", "MAIL_FROM", "DATA_GO_KR_KEY", "FIREBASE_SERVICE_ACCOUNT", "MODEL_URL", "MODEL_KEY"];
const STAT_NAMES = ["visits", "wiki", "holidays", "kidConsent", "notify", "taskRun", "mailSent", "mailFail", "chat"];

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
  if (u?.email && u.email.toLowerCase() === admin && !u.emailVerified) return { err: json({ error: "이메일 인증이 필요해요. 받은 인증 메일의 링크를 누른 뒤 ‘인증 확인’을 눌러 주세요.", needVerify: true }, 403) };
  if (!u?.email || !u.emailVerified || u.email.toLowerCase() !== admin) return { err: json({ error: "관리자만 볼 수 있어요" }, 403) };
  return { email: u.email };
}
function hint(v, n) {
  if (!v) return "";
  if (n === "FIREBASE_SERVICE_ACCOUNT") { try { return JSON.parse(v).client_email.split("@")[0].slice(0, 22); } catch { return "설정됨"; } }
  return v.length > 10 ? "…" + v.slice(-4) : "설정됨";
}
async function adminStatus(env, raw) {
  const secrets = {};
  for (const n of SECRET_NAMES) {
    const fromEnv = !!raw[n];
    const kv = env.ADMIN_KV ? await env.ADMIN_KV.get("secret:" + n) : null;
    secrets[n] = { set: fromEnv || !!kv, source: fromEnv ? "dashboard" : kv ? "admin" : null, hint: hint(raw[n] || kv || "", n), canEdit: !!env.ADMIN_KV && !fromEnv };
  }
  {
    const fc = raw.FIREBASE_CONFIG ? String(raw.FIREBASE_CONFIG) : "";
    const pid = (fc.match(/["']?projectId["']?\s*:\s*["']([^"']+)["']/) || [])[1];
    secrets.FIREBASE_CONFIG = { set: !!fc, source: fc ? "dashboard" : null, hint: fc ? (pid ? "projectId: " + pid : "설정됨") : "", canEdit: false };
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
  const apis = [];
  if (env.ADMIN_KV) {
    try {
      const l = await env.ADMIN_KV.list({ prefix: "api:", limit: 100 });
      for (const k of l.keys) { try { const o = JSON.parse(await env.ADMIN_KV.get(k.name)); apis.push({ id: o.id, provider: o.provider, name: o.name, desc: o.desc, url: o.url || "", hint: hint(o.key || "", "X"), created: o.created }); } catch {} }
    } catch {}
    apis.sort((x, y) => (y.created || 0) - (x.created || 0));
  }
  return { kv: !!env.ADMIN_KV, firebase: !!raw.FIREBASE_CONFIG, secrets, days, apis };
}
async function adminApi(req, env, ctx, url, raw) {
  const a = await adminAuth(req, raw, url);
  if (a.err) return a.err;
  const p = url.pathname;
  if (p === "/api/admin/status" && req.method === "GET") return json({ email: a.email, ...(await adminStatus(env, raw)) });
  if (p === "/api/admin/users" && req.method === "GET") {
    if (!saOf(env)) return json({ error: "FIREBASE_SERVICE_ACCOUNT가 없어요. 관리자 화면 → 키와 설정에서 넣어 주세요.", needSa: true }, 503);
    try { await sweep(env); return json({ users: await listUsers(env) }); } catch (e) { return json({ error: String(e.message || e) }, 502); }
  }
  if (req.method !== "POST") return json({ error: "POST만 돼요" }, 405);
  let b = {};
  try { b = await req.json(); } catch {}
  if (p === "/api/admin/users/action") {
    if (!saOf(env)) return json({ error: "FIREBASE_SERVICE_ACCOUNT가 없어요", needSa: true }, 503);
    try { return await userAction(env, a.email, b); } catch (e) { return json({ error: String(e.message || e) }, 502); }
  }
  if (p === "/api/admin/api" || p === "/api/admin/api/delete" || p === "/api/admin/api/test") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    if (p === "/api/admin/api") {
      const provider = String(b.provider || "").trim().slice(0, 40), name = String(b.name || "").trim(), key = String(b.key || "").trim(), desc = String(b.desc || "").trim(), u = String(b.url || "").trim();
      if (!provider || !name || name.length > 40) return json({ error: "제공처와 이름(40자 이하)을 확인해 주세요" }, 400);
      if (!key || key.length > 500) return json({ error: "API 키를 확인해 주세요" }, 400);
      if (desc.length > 300) return json({ error: "설명은 300자 이하로 써 주세요" }, 400);
      if (u && !/^https:\/\/[^\s]{4,300}$/.test(u)) return json({ error: "주소는 https://로 시작해야 해요" }, 400);
      const cnt = (await env.ADMIN_KV.list({ prefix: "api:", limit: 100 })).keys.length;
      if (cnt >= 50) return json({ error: "API는 50개까지 넣을 수 있어요" }, 400);
      const id = crypto.randomUUID().slice(0, 8);
      await env.ADMIN_KV.put("api:" + id, JSON.stringify({ id, provider, name, key, desc, url: u, created: Date.now() }));
      return json({ ok: true, id });
    }
    const id = String(b.id || "").replace(/[^a-z0-9-]/gi, "");
    if (p.endsWith("/delete")) { await env.ADMIN_KV.delete("api:" + id); return json({ ok: true }); }
    let o; try { o = JSON.parse(await env.ADMIN_KV.get("api:" + id)); } catch {}
    if (!o) return json({ error: "없는 API예요" }, 404);
    if (!o.url) return json({ error: "테스트할 주소가 없어요" }, 400);
    try {
      const t = new URL(o.url);
      const hdr = { "user-agent": UA, accept: "application/json, application/xml, */*" };
      const bearer = /hugging|github/i.test(o.provider);
      if (bearer) { hdr.authorization = "Bearer " + o.key; if (/github/i.test(o.provider)) hdr.accept = "application/vnd.github+json"; }
      else if (!t.searchParams.has("serviceKey") && /data\.go\.kr/i.test(o.provider + t.host)) t.searchParams.set("serviceKey", o.key);
      const r = await fetch(t.toString(), { headers: hdr });
      const raw = await r.text();
      let sample;
      if (bearer) { let j = {}; try { j = JSON.parse(raw); } catch {} const who = j.name || j.login || j.fullname; sample = r.ok ? (who ? "계정: " + who : "확인됐어요") : (j.message || j.error || "거절됐어요 (토큰을 확인해 주세요)"); }
      else sample = raw.slice(0, 200).replace(/\s+/g, " ").split(o.key).join("***");
      return json({ ok: r.ok, status: r.status, sample });
    } catch (e) { return json({ error: "연결하지 못했어요: " + String(e.message || e) }, 502); }
  }
  if (p === "/api/admin/secret" || p === "/api/admin/secret/delete") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const n = String(b.name || "");
    if (!SECRET_NAMES.includes(n)) return json({ error: "바꿀 수 없는 이름이에요" }, 400);
    if (p.endsWith("/delete")) await env.ADMIN_KV.delete("secret:" + n);
    else {
      let v = String(b.value || "").trim();
      if (n === "FIREBASE_SERVICE_ACCOUNT") {
        try { const o = JSON.parse(v); if (!o.client_email || !o.private_key || !o.project_id) throw 0; v = JSON.stringify(o); } catch { return json({ error: "서비스 계정 JSON 파일 내용 전체를 붙여넣어 주세요" }, 400); }
      }
      if (n === "MODEL_URL") { v = v.replace(/\/+$/, ""); if (!/^https:\/\/[^\s]{4,300}$/.test(v)) return json({ error: "https://로 시작하는 주소를 넣어 주세요" }, 400); }
      if (!v || v.length > (n === "FIREBASE_SERVICE_ACCOUNT" ? 8000 : 500)) return json({ error: "값을 확인해 주세요" }, 400);
      await env.ADMIN_KV.put("secret:" + n, v);
      if (n === "FIREBASE_SERVICE_ACCOUNT") gTok.exp = 0;
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
  async scheduled(event, rawEnv, ctx) {
    ctx.waitUntil((async () => { const env = await withSecrets(rawEnv); try { await sweep(env); } catch {} try { await runTasks(env, ctx); } catch {} })());
  },
  async fetch(req, rawEnv, ctx) {
    const raw = rawEnv;
    const env = await withSecrets(rawEnv);
    const url = new URL(req.url);
    const p = url.pathname;
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      if (p === "/api/tasks/sync") return req.method === "POST" ? await tasksSync(req, env, url) : json({ error: "POST만 돼요" }, 405);
      if (p === "/api/me") return req.method === "GET" ? await me(req, env, url) : json({ error: "GET만 돼요" }, 405);
      if (p.startsWith("/api/admin/")) return await adminApi(req, env, ctx, url, raw);
      if (p === "/api/kid-consent") return req.method === "POST" ? (bump(env, ctx, "kidConsent"), await kidConsent(req, env, url, ctx)) : json({ error: "POST만 돼요" }, 405);
      if (p === "/api/chat") return req.method === "POST" ? await chat(req, env, url, ctx) : json({ error: "POST만 돼요" }, 405);
      if (p === "/api/notify") return req.method === "POST" ? (bump(env, ctx, "notify"), await notify(req, env, url, ctx)) : json({ error: "POST만 돼요" }, 405);
      if (req.method !== "GET") return json({ error: "GET만 돼요" }, 405);
      if (p === "/api/config") {
        bump(env, ctx, "visits");
        return json({
          firebase: readFirebase(env),
          publicData: !!env.DATA_GO_KR_KEY,
          mail: !!env.RESEND_API_KEY,
          tasks: !!(saOf(env) && env.RESEND_API_KEY),
          wiki: true,
          model: !!(env.MODEL_URL && env.MODEL_KEY),
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
