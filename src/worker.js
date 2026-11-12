// LAGO AI — Cloudflare Worker
// 정적 파일(public/)은 Workers Assets가 내보내고, /api/* 만 이 코드가 처리해요.
// 시크릿(대시보드 또는 `npx wrangler secret put 이름`으로 넣기):
//   FIREBASE_CONFIG  — Firebase 웹 앱 설정 JSON 한 줄 (예: {"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."})
//   DATA_GO_KR_KEY   — 공공데이터포털(data.go.kr) 일반 인증키 (Decoding 키)
//   RESEND_API_KEY   — (선택) 보호자 이메일 알림용 Resend API 키. 없으면 이메일은 안 보내요.
//   MAIL_FROM        — (선택) 보내는 사람. 기본값 "LAGO <onboarding@resend.dev>" (이 주소는 Resend 가입 이메일에만 보낼 수 있어요)
// 키는 브라우저로 내려보내지 않아요. 공공데이터 호출은 이 Worker가 대신 해요.

import { okMcpUrl, mcpRisk, maskUrl, mcpTools, mcpCall, runWithMcp, userServers, serverTools } from "./mcp.js";

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
// ---------- llama.cpp llama-server (OpenAI 호환) ----------
// 주소(LLAMA_URL)는 KV(config:llama_url)에, 키(LLAMA_API_KEY)는 Worker Secret에 둬요. 브라우저는 둘 다 모르고 /api/chat 만 불러요.
async function llamaUrl(env) {
  if (!env.ADMIN_KV) return "";
  try { return String((await env.ADMIN_KV.get("config:llama_url")) || "").replace(/\/+$/, ""); } catch { return ""; }
}
const okLlamaUrl = (v) => /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i.test(v) && v.length <= 300 && !/^https:\/\/(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(v);
const MODELS = ["fonte", "torrente", "mare", "code"];
const okModel = (v) => (MODELS.includes(String(v || "").toLowerCase()) ? String(v).toLowerCase() : "");
async function llamaChat(env, base, system, user, maxTok, signal, model) {
  const r = await fetch(base + "/v1/chat/completions", {
    method: "POST", signal,
    headers: { "content-type": "application/json", authorization: "Bearer " + env.LLAMA_API_KEY, "user-agent": UA },
    body: JSON.stringify({ messages: [{ role: "system", content: system }, { role: "user", content: user }], stream: false, max_tokens: maxTok, ...(model ? { model } : {}) }),
  });
  if (!r.ok) return { status: r.status };
  const d = await r.json();
  return { answer: String(d?.choices?.[0]?.message?.content || "") };
}

// ---------- 폰테 버전 전환 (태블릿 llama-server에 올라온 LoRA 어댑터 중 하나만 켜요) ----------
const VERS = [
  { id: "fonte_1.0", file: "fonte.gguf", label: "폰테 1.0", note: "짧은 FACT" },
  { id: "fonte_1.1", file: "fonte_1.1.gguf", label: "폰테 1.1", note: "자세한 FACT" },
  { id: "fonte_1.2", file: "fonte_1.2.gguf", label: "폰테 1.2", note: "MCP 도구" },
];
const verOf = (path) => { const f = String(path || "").split(/[\\/]/).pop(); const x = VERS.find((v) => v.file === f); return x ? x.id : f; };
async function loraFetch(env, base, method, body) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(base + "/lora-adapters", { method, signal: ac.signal, headers: { "content-type": "application/json", authorization: "Bearer " + env.LLAMA_API_KEY, "user-agent": UA }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!r.ok) return { ok: false, msg: r.status === 401 ? "서버 키가 맞지 않아요" : "서버 응답 " + r.status };
    return { ok: true, data: await r.json().catch(() => null) };
  } catch { return { ok: false, msg: "서버에 연결하지 못했어요 (꺼졌거나 주소가 바뀌었어요)" }; } finally { clearTimeout(tm); }
}
async function loraState(env, base) {
  const r = await loraFetch(env, base, "GET"); if (!r.ok) return r;
  const list = Array.isArray(r.data) ? r.data : [];
  const on = list.find((x) => Number(x.scale) > 0);
  return { ok: true, list, loaded: list.map((x) => verOf(x.path)), active: on ? verOf(on.path) : "" };
}
async function loraApply(env, base, ver) {
  const st = await loraState(env, base); if (!st.ok) return st;
  if (!st.loaded.includes(ver)) return { ok: false, msg: "태블릿에 그 버전 파일이 올라와 있지 않아요 (태블릿에서 bash ~/lago.sh update)" };
  const r = await loraFetch(env, base, "POST", st.list.map((x) => ({ id: x.id, scale: verOf(x.path) === ver ? 1 : 0 })));
  return r.ok ? { ok: true } : r;
}
// 캐글 서버(fact_7)는 요청마다 version을 실어 보내서 바꿔요. 서버에 올라온 버전만 확인해요.
async function kagState(env) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(env.MODEL_URL + "/versions", { signal: ac.signal, headers: { "x-key": env.MODEL_KEY, "user-agent": UA } });
    if (!r.ok) return { ok: false, msg: r.status === 401 ? "서버 키(MODEL_KEY)가 맞지 않아요" : r.status === 404 ? "캐글 노트북이 예전 버전이에요 (fact_7을 새로 올려 주세요)" : "서버 응답 " + r.status };
    const d = await r.json();
    return { ok: true, loaded: Array.isArray(d.versions) ? d.versions : [], active: String(d.active || "") };
  } catch { return { ok: false, msg: "캐글 서버에 연결하지 못했어요 (꺼졌거나 주소가 바뀌었어요)" }; } finally { clearTimeout(tm); }
}
const hasBackend = (env, base) => !!((base && env.LLAMA_API_KEY) || (env.MODEL_URL && env.MODEL_KEY));
async function backendState(env, base) {
  if (base && env.LLAMA_API_KEY) return loraState(env, base);
  if (env.MODEL_URL && env.MODEL_KEY) return kagState(env);
  return { ok: false, msg: "서버 주소·키가 없어요" };
}
async function backendApply(env, base, ver) {
  if (base && env.LLAMA_API_KEY) return loraApply(env, base, ver);
  const st = await kagState(env); if (!st.ok) return st;
  return st.loaded.includes(ver) ? { ok: true } : { ok: false, msg: "캐글 서버에 그 버전이 올라와 있지 않아요 (fact_7의 VERSIONS를 확인하세요)" };
}
let loraKey = "";
// 서버가 새로 켜졌거나 고른 버전이 바뀌었으면 한 번만 맞춰 줘요 (같은 주소·버전이면 건너뛰어요)
async function ensureLora(env, base) {
  try {
    const ver = await env.ADMIN_KV.get("config:model_version"); if (!ver) return;
    const key = base + "|" + ver; if (key === loraKey) return;
    const r = await loraApply(env, base, ver); if (r.ok) loraKey = key;
  } catch {}
}
// 대화 기록 (관리자만 볼 수 있어요, 14일 뒤 자동 삭제, 누가 물었는지는 저장하지 않아요)
async function logChat(env, r) {
  try {
    if (!env.ADMIN_KV) return;
    r.ver = (await env.ADMIN_KV.get("config:model_version")) || "fonte_1.0";
    await env.ADMIN_KV.put("clog:" + String(9999999999999 - Date.now()).padStart(13, "0") + ":" + rid(), JSON.stringify(r), { expirationTtl: 14 * 86400 });
  } catch {}
}

// ---------- 대화 공유 · AI 도구 배포 (KV에 저장, 링크로 누구나 읽기) ----------
const rid = () => { const a = new Uint8Array(8); crypto.getRandomValues(a); return [...a].map((x) => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join(""); };
const cap = (v, n) => String(v == null ? "" : v).slice(0, n);
async function pubGate(req, env, url, ctx) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return { err: json({ error: "허용되지 않은 요청이에요" }, 403) };
  if (!env.ADMIN_KV) return { err: json({ error: "저장소(ADMIN_KV)가 연결되지 않았어요" }, 503) };
  const u = await tokenUser(req, env);
  if (!u) return { err: json({ error: "로그인이 필요해요" }, 401) };
  if (saOf(env)) { const m = await getMod(env, u.localId); if (m.banned || (m.tempBan && (m.bannedUntil || 0) > Date.now())) return { err: json({ error: "사용이 제한된 계정이에요" }, 403) }; }
  const k = `pub:${u.localId}:${day()}`, n = parseInt((await env.ADMIN_KV.get(k)) || "0", 10);
  if (n >= 60) return { err: json({ error: "오늘은 공유·배포를 더 할 수 없어요" }, 429) };
  await env.ADMIN_KV.put(k, String(n + 1), { expirationTtl: 172800 });
  return { u };
}
const normEmails = (v) => [...new Set((Array.isArray(v) ? v : String(v || "").split(/[\s,;]+/)).map((x) => String(x).trim().toLowerCase()).filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) && x.length <= 120))].slice(0, 10);
// 이메일로 지정한 사람만 볼 수 있는 항목: 로그인(메일 인증)한 같은 주소이거나 주인이어야 해요
async function audCheck(req, env, d) {
  if (!d.emails || !d.emails.length) return null;
  const u = await tokenUser(req, env);
  if (!u) return json({ error: "지정된 사람만 볼 수 있어요. 로그인해 주세요", needLogin: true }, 401);
  if (u.localId === d.owner) return null;
  if (u.emailVerified && d.emails.includes(String(u.email || "").toLowerCase())) return null;
  return json({ error: "이 링크는 지정된 사람만 열 수 있어요", restricted: true }, 403);
}
async function inviteMail(env, url, to, name, link, from) {
  if (!env.RESEND_API_KEY || !to.length) return 0;
  let n = 0;
  for (const t of to) {
    try {
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ from: env.MAIL_FROM || "LAGO <onboarding@resend.dev>", to: [t], subject: `[LAGO] ${cap(from, 20) || "누군가"}님이 '${cap(name, 40)}'을(를) 보냈어요`, text: `${cap(from, 20) || "누군가"}님이 LAGO에서 '${cap(name, 40)}'을(를) 보냈어요.\n\n${link}\n\n이 주소로 LAGO에 로그인하면 열 수 있어요. 모르는 사람이 보냈다면 이 메일은 무시해도 돼요.` }) });
      if (r.ok) n++;
    } catch {}
  }
  return n;
}
function htmlPage(body) {
  return new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer",
    "content-security-policy": "sandbox allow-scripts allow-forms allow-popups allow-modals; default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob: https:; media-src data: blob: https:; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" } });
}

// 공지 + 최신 앱 버전. 공지는 KV(config:notice)에 있으면 그걸, 없으면 아래 기본 공지를 보여줘요.
const NOTICE_DEFAULT = { id: "20261110", title: "LAGO 앱이 새로워졌어요", body: "· 창 위쪽 띠를 깔끔하게 다듬었어요.\n· 계정 메뉴 ‘앱 받기’에서 Windows · Mac · Android · 터미널(lago)을 받을 수 있어요.\n· 화면과 모델은 다시 켜기만 하면 바뀌고, 앱 껍데기가 바뀔 때만 새로 받으면 돼요.\n· 사이트를 홈 화면에 추가하면 다른 기기에서도 앱처럼 써요." };
async function updateInfo(env, ctx) {
  let notice = NOTICE_DEFAULT;
  try { const o = env.ADMIN_KV && await env.ADMIN_KV.get("config:notice"); if (o) { const j = JSON.parse(o); if (j && j.title) notice = { id: String(j.id || "n"), title: String(j.title).slice(0, 80), body: String(j.body || "").slice(0, 1500) }; } } catch {}
  const out = { notice, latest: "", notes: "", url: "https://github.com/lagem1535-create/LAGO_AI_home/releases/latest" };
  try {
    const r = await fetch("https://api.github.com/repos/lagem1535-create/LAGO_AI_home/releases/latest", { headers: { "user-agent": "lago-ai", accept: "application/vnd.github+json" }, cf: { cacheTtl: 300, cacheEverything: true } });
    if (r.ok) { const j = await r.json(); const m = /^app-v(\d+\.\d+\.\d+)/.exec(String(j.tag_name || "")); if (m) { out.latest = m[1]; out.notes = String(j.body || "").slice(0, 800); } }
  } catch {}
  return out;
}
const isDev = async (env, uid) => !!(uid && env.ADMIN_KV && (await env.ADMIN_KV.get("dev:" + uid)));
async function shareTools(req, env, url, ctx, p) {
  const post = req.method === "POST";
  // 공개 읽기
  let m = p.match(/^\/api\/share\/([a-z0-9]{6,16})$/);
  if (m && req.method === "GET") {
    const o = env.ADMIN_KV && await env.ADMIN_KV.get("share:" + m[1]);
    if (!o) return json({ error: "공유가 끝났거나 없는 링크예요" }, 404);
    const d = JSON.parse(o); const ae = await audCheck(req, env, d); if (ae) return ae; return json({ title: d.title, name: d.name, msgs: d.msgs, at: d.at, upd: d.upd }, 200, { "x-robots-tag": "noindex" });
  }
  m = p.match(/^\/api\/dev\/cover\/([a-z0-9]{6,16})$/);
  if (m && req.method === "GET") {
    const o = env.ADMIN_KV && await env.ADMIN_KV.get("tool:" + m[1]);
    let d; try { d = o && JSON.parse(o); } catch {}
    const mm = d && d.viaDev && !d.hidden && !(d.emails && d.emails.length) && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(d.cover || "");
    if (!mm) return new Response("", { status: 404 });
    const bin = Uint8Array.from(atob(mm[2]), (c) => c.charCodeAt(0));
    return new Response(bin, { headers: { "content-type": mm[1], "cache-control": "public, max-age=600", "x-content-type-options": "nosniff" } });
  }
  if (p === "/api/dev/list" && req.method === "GET") {
    const u = await tokenUser(req, env);
    if (!u) return json({ error: "로그인해 주세요" }, 401);
    const out = []; let cur;
    for (let n = 0; n < 5; n++) {
      const l = await env.ADMIN_KV.list({ prefix: "tool:", cursor: cur, limit: 200 });
      for (const k of l.keys) {
        const o = await env.ADMIN_KV.get(k.name); if (!o) continue;
        let d; try { d = JSON.parse(o); } catch { continue; }
        if (!d.viaDev || d.hidden || (d.emails && d.emails.length)) continue;
        if (!(await isDev(env, d.owner))) continue;
        out.push({ id: k.name.slice(5), cover: !!d.cover, kind: d.kind || "tool", name: d.name, desc: d.desc || "", owner: d.ownerName || "", at: d.at || 0, runs: d.runs || 0, mine: d.owner === u.localId });
      }
      if (l.list_complete) break; cur = l.cursor;
    }
    out.sort((x, y) => y.at - x.at);
    return json({ items: out.slice(0, 100) });
  }
  if (p === "/api/dev/me") {
    const u = await tokenUser(req, env);
    if (!u) return json({ error: "로그인해 주세요" }, 401);
    return json({ dev: await isDev(env, u.localId), verified: !!u.emailVerified, email: u.email || "" });
  }
  m = p.match(/^\/api\/html\/([a-z0-9]{6,16})$/);
  if (m && req.method === "GET") {
    const o = env.ADMIN_KV && await env.ADMIN_KV.get("html:" + m[1]);
    if (!o) return json({ error: "공개가 끝났거나 없는 페이지예요" }, 404);
    const d = JSON.parse(o); return json({ title: d.title, code: d.code, owner: d.ownerName || "" }, 200, { "x-robots-tag": "noindex" });
  }
  m = p.match(/^\/api\/tools\/([a-z0-9]{6,16})$/);
  if (m && req.method === "GET") {
    const o = env.ADMIN_KV && await env.ADMIN_KV.get("tool:" + m[1]);
    if (!o) return json({ error: "배포가 끝났거나 없는 도구예요" }, 404);
    const d = JSON.parse(o); const ae = await audCheck(req, env, d); if (ae) return ae; return json({ id: m[1], kind: d.kind || "tool", ...(d.kind === "mcp" ? { mcpTools: (d.mcpTools || {}).names || [], mcpN: (d.mcpTools || {}).n || 0 } : {}), name: d.name, desc: d.desc, input: d.input, opts: d.opts, starters: d.starters || [], model: d.model || "", owner: d.ownerName || "", dev: await isDev(env, d.owner), runs: d.runs || 0 });
  }
  if (!post) return json({ error: "POST만 돼요" }, 405);
  if (p === "/api/share") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    let b = {}; try { b = await req.json(); } catch {}
    const msgs = (Array.isArray(b.msgs) ? b.msgs : []).slice(0, 200).map((x) => {
      const o = { r: x && x.r === "a" ? "a" : "u", t: cap(x && x.t, 4000) };
      if (x && x.att && x.att.name) o.att = { kind: ["image", "file", "text"].includes(x.att.kind) ? x.att.kind : "file", name: cap(x.att.name, 80), chars: +x.att.chars || 0 };
      if (Array.isArray(x && x.src)) o.src = x.src.slice(0, 8).map((y) => ({ n: +y.n || 0, title: cap(y.title, 100), db: cap(y.db, 20), url: /^https?:\/\//.test(y.url || "") ? cap(y.url, 300) : "", date: cap(y.date, 10), publisher: cap(y.publisher, 40) }));
      return o;
    }).filter((x) => x.t);
    if (!msgs.length) return json({ error: "공유할 대화가 비어 있어요" }, 400);
    const d = { title: cap(b.title, 60) || "대화", name: b.showName ? cap(b.name, 30) : "", msgs, owner: g.u.localId, at: Date.now(), emails: normEmails(b.emails) };
    if (JSON.stringify(d).length > 180000) return json({ error: "대화가 너무 길어요. 앞부분을 줄여서 공유해 주세요" }, 413);
    let id = /^[a-z0-9]{6,16}$/.test(b.id || "") ? b.id : "";
    if (id) {
      const old = await env.ADMIN_KV.get("share:" + id);
      if (old) { const od = JSON.parse(old); if (od.owner !== g.u.localId) return json({ error: "내 공유가 아니에요" }, 403); d.at = od.at; d.upd = Date.now(); } else id = "";
    }
    if (!id) id = rid();
    await env.ADMIN_KV.put("share:" + id, JSON.stringify(d));
    const sent = b.invite && d.emails.length ? await inviteMail(env, url, d.emails, d.title, url.origin + "/s/" + id, g.u.displayName || b.name) : 0;
    return json({ ok: true, id, url: url.origin + "/s/" + id, sent, mail: !!env.RESEND_API_KEY });
  }
  if (p === "/api/share/delete" || p === "/api/tools/unpublish") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    let b = {}; try { b = await req.json(); } catch {}
    const key = (p === "/api/share/delete" ? "share:" : "tool:") + cap(b.id, 16);
    const o = await env.ADMIN_KV.get(key);
    if (o) { if (JSON.parse(o).owner !== g.u.localId) return json({ error: "내 것이 아니에요" }, 403); await env.ADMIN_KV.delete(key); }
    return json({ ok: true });
  }
  if (p === "/api/tools/publish") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    let b = {}; try { b = await req.json(); } catch {}
    const isMcp = b.kind === "mcp";
    const name = cap(b.name, 30).trim(), ins = isMcp ? "MCP" : cap(b.ins, 1500).trim();
    if (!name || !ins) return json({ error: "이름과 지시문이 필요해요" }, 400);
    let mcpInfo = null;
    if (isMcp) {
      if (!(await isDev(env, g.u.localId))) return json({ error: "MCP는 LAGO DEV만 올릴 수 있어요" }, 403);
      const rk = mcpRisk(b.url);
      if (rk.block) return json({ error: rk.block, block: true, url: maskUrl(b.url) }, 400);
      if (rk.warn.length && !b.ack) return json({ error: "주소에 주의가 필요해요", needAck: true, risk: rk.warn, url: maskUrl(b.url) }, 400);
      try { const tl = await mcpTools({ url: b.url, token: cap(b.token, 400) }, true); if (!tl.length) return json({ error: "서버에 연결됐지만 쓸 수 있는 도구가 없어요" }, 400); mcpInfo = { n: tl.length, names: tl.slice(0, 12).map((t) => t.name) }; } catch (e) { return json({ error: "MCP 서버에 연결하지 못했어요: " + String(e.message || e).slice(0, 120) }, 400); }
    }
    const d = { name, desc: cap(b.desc, 120), ins, input: ["text", "file", "both"].includes(b.input) ? b.input : "text", opts: (Array.isArray(b.opts) ? b.opts : []).slice(0, 8).map((x) => cap(x, 20)).filter(Boolean), owner: g.u.localId, ownerName: b.showName ? cap(b.ownerName, 30) : "", at: Date.now(), kind: b.kind === "mode" ? "mode" : b.kind === "mcp" ? "mcp" : "tool", starters: (Array.isArray(b.starters) ? b.starters : []).slice(0, 3).map((x) => cap(x, 80)).filter(Boolean), model: okModel(b.model), emails: normEmails(b.emails), viaDev: !!b.viaDev && await isDev(env, g.u.localId), cover: /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(b.cover || "") && b.cover.length < 120000 ? b.cover : "" };
    if (mcpInfo) { d.mcpUrl = b.url; d.mcpToken = cap(b.token, 400); d.mcpTools = mcpInfo; }
    let id = /^[a-z0-9]{6,16}$/.test(b.id || "") ? b.id : "";
    if (id) {
      const old = await env.ADMIN_KV.get("tool:" + id);
      if (old) { const od = JSON.parse(old); if (od.owner !== g.u.localId) return json({ error: "내 도구가 아니에요" }, 403); d.at = od.at; d.runs = od.runs || 0; } else id = "";
    }
    if (!id) {
      const k = "utools:" + g.u.localId, list = JSON.parse((await env.ADMIN_KV.get(k)) || "[]").filter(Boolean);
      const live = []; for (const x of list) if (await env.ADMIN_KV.get("tool:" + x)) live.push(x);
      if (live.length >= 10) return json({ error: "배포한 도구는 10개까지예요. 하나를 내려 주세요" }, 400);
      id = rid(); live.push(id); await env.ADMIN_KV.put(k, JSON.stringify(live));
    }
    await env.ADMIN_KV.put("tool:" + id, JSON.stringify(d));
    const link = url.origin + "/t/" + id;
    const sent = b.invite && d.emails.length ? await inviteMail(env, url, d.emails, d.name, link, b.ownerName || g.u.displayName) : 0;
    return json({ ok: true, id, url: link, sent, mail: !!env.RESEND_API_KEY });
  }
  if (p === "/api/html/publish") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    let b = {}; try { b = await req.json(); } catch {}
    const code = String(b.code || ""), title = cap(b.title, 40).trim() || "내 페이지";
    if (code.length < 20) return json({ error: "HTML이 너무 짧아요" }, 400);
    if (code.length > 200000) return json({ error: "HTML은 200KB까지예요" }, 413);
    if (!/<\/?[a-z][\s\S]*>/i.test(code)) return json({ error: "HTML 코드가 아니에요" }, 400);
    const d = { title, code, owner: g.u.localId, ownerName: b.showName ? cap(b.ownerName, 30) : "", at: Date.now(), emails: normEmails(b.emails) };
    let id = /^[a-z0-9]{6,16}$/.test(b.id || "") ? b.id : "";
    if (id) {
      const old = await env.ADMIN_KV.get("html:" + id);
      if (old) { const od = JSON.parse(old); if (od.owner !== g.u.localId) return json({ error: "내 페이지가 아니에요" }, 403); d.at = od.at; d.upd = Date.now(); } else id = "";
    }
    if (!id) {
      const k = "uhtml:" + g.u.localId, list = JSON.parse((await env.ADMIN_KV.get(k)) || "[]").filter(Boolean);
      const live = []; for (const x of list) if (await env.ADMIN_KV.get("html:" + x)) live.push(x);
      if (live.length >= 10) return json({ error: "공개한 페이지는 10개까지예요. 하나를 내려 주세요" }, 400);
      id = rid(); live.push(id); await env.ADMIN_KV.put(k, JSON.stringify(live));
    }
    await env.ADMIN_KV.put("html:" + id, JSON.stringify(d));
    const link = url.origin + "/h/" + id;
    const sent = b.invite && d.emails.length ? await inviteMail(env, url, d.emails, title, link, b.ownerName || g.u.displayName) : 0;
    return json({ ok: true, id, url: link, sent, mail: !!env.RESEND_API_KEY });
  }
  if (p === "/api/html/unpublish") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    let b = {}; try { b = await req.json(); } catch {}
    const key = "html:" + cap(b.id, 16), o = await env.ADMIN_KV.get(key);
    if (o) { if (JSON.parse(o).owner !== g.u.localId) return json({ error: "내 것이 아니에요" }, 403); await env.ADMIN_KV.delete(key); }
    return json({ ok: true });
  }
  if (p === "/api/dev/join") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    if (!g.u.emailVerified) return json({ error: "이메일 인증을 먼저 끝내 주세요 (받은 메일의 링크를 누르면 돼요)" }, 403);
    let b = {}; try { b = await req.json(); } catch {}
    await env.ADMIN_KV.put("dev:" + g.u.localId, JSON.stringify({ name: cap(b.name || g.u.displayName, 30), email: g.u.email || "", at: Date.now() }));
    return json({ ok: true, dev: true });
  }
  if (p === "/api/tools/import") {
    const g = await pubGate(req, env, url, ctx); if (g.err) return g.err;
    let b = {}; try { b = await req.json(); } catch {}
    const o = await env.ADMIN_KV.get("tool:" + cap(b.id, 16));
    if (!o) return json({ error: "공개가 끝났거나 없는 항목이에요" }, 404);
    const d = JSON.parse(o); const ae = await audCheck(req, env, d); if (ae) return ae;
    ctx.waitUntil(env.ADMIN_KV.put("tool:" + cap(b.id, 16), JSON.stringify({ ...d, imports: (d.imports || 0) + 1 })));
    return json({ ok: true, kind: d.kind || "tool", ...(d.kind === "mcp" ? { mcpTools: (d.mcpTools || {}).names || [] } : {}), name: d.name, desc: d.desc, ins: d.ins, input: d.input, opts: d.opts, starters: d.starters || [], model: d.model || "", owner: d.ownerName || "", dev: await isDev(env, d.owner) });
  }
  if (p === "/api/tools/run") {
    let b = {}; try { b = await req.clone().json(); } catch {}
    const o = env.ADMIN_KV && await env.ADMIN_KV.get("tool:" + cap(b.id, 16));
    if (!o) return json({ error: "배포가 끝났거나 없는 도구예요" }, 404);
    const d = JSON.parse(o);
    if (d.kind === "mcp") return json({ error: "MCP는 서비스 연결에서 켜서 써요" }, 400);
    const ae = await audCheck(req, env, d); if (ae) return ae;
    const ins = d.ins + (b.opt && d.opts.includes(b.opt) ? "\n선택한 옵션: " + b.opt : "");
    const r2 = new Request(req.url, { method: "POST", headers: req.headers, body: JSON.stringify({ task: "agent", q: cap(b.text, 500), ctx: cap(b.text, 3000), agent: { name: d.name, instructions: ins }, tool: (d.kind || "tool") === "tool", model: d.model || undefined }) });
    const res = await chat(r2, env, url, ctx);
    if (res.status === 200 && ctx && ctx.waitUntil) ctx.waitUntil(env.ADMIN_KV.put("tool:" + b.id, JSON.stringify({ ...d, runs: (d.runs || 0) + 1 })));
    return res;
  }
  return json({ error: "없는 경로예요" }, 404);
}


// ---------- 뉴스 (언론사 RSS를 질문 올 때 바로 읽어요. 키·DB 필요 없음) ----------
// 주소는 lago_ai_db/collect_news.py 의 FEEDS 와 같은 곳이에요.
const NEWS_RE = /뉴스|속보|소식|기사|헤드라인/;
const NEWS_STOP = /^(뉴스|속보|소식|기사|헤드라인|알려|알려줘|알려주세요|알려줄래|보여줘|오늘|오늘의|오늘은|최근|요즘|지금|현재|좀|줘|해줘|뭐야|뭐|있어|있나|어때|무슨|주요|관련|대한|에서|있는)$/;
const NEWS_FEEDS = [
  ["BBC 코리아", "https://feeds.bbci.co.uk/korean/rss.xml"],
  ["경향신문", "https://www.khan.co.kr/rss/rssdata/total_news.xml"],
  ["동아일보", "https://rss.donga.com/total.xml"],
  ["한겨레", "https://www.hani.co.kr/rss/"],
  ["서울신문", "https://www.seoul.co.kr/xml/rss/rss_politics.xml"],
  ["서울신문", "https://www.seoul.co.kr/xml/rss/rss_economy.xml"],
  ["서울신문", "https://www.seoul.co.kr/xml/rss/rss_society.xml"],
  ["뉴시스", "https://newsis.com/RSS/society.xml"],
  ["뉴시스", "https://newsis.com/RSS/economy.xml"],
];
const xmlText = (t) => String(t || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
function parseFeed(xml, pub) {
  const out = [];
  const blocks = String(xml || "").match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  for (const b of blocks.slice(0, 40)) {
    const g = (n) => { const m = b.match(new RegExp("<" + n + "[^>]*>([\\s\\S]*?)</" + n + ">", "i")); return m ? m[1] : ""; };
    const title = xmlText(g("title"));
    let link = xmlText(g("link")); if (!link) { const m = b.match(/<link[^>]*href=["']([^"']+)["']/i); link = m ? m[1] : ""; }
    const sum = xmlText(g("description") || g("summary") || g("content:encoded")).slice(0, 300);
    const ts = Date.parse(xmlText(g("pubDate") || g("dc:date") || g("published") || g("updated"))) || 0;
    if (title) out.push({ title: title.slice(0, 150), extract: sum && sum !== title ? sum : "", url: /^https?:\/\//.test(link) ? link.slice(0, 300) : "", publisher: pub, ts, db: "뉴스" });
  }
  return out;
}
function newsTokens(q) {
  return String(q).replace(/[?？!.,~"'`]/g, " ").split(/\s+/).map((w) => w.replace(/(은|는|이|가|을|를|의|에|도|만|와|과)$/, "")).filter((w) => w.length >= 2 && !NEWS_STOP.test(w));
}
async function rssNews(report) {
  const all = (await Promise.all(NEWS_FEEDS.map(async ([pub, u]) => {
    try {
      const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (LAGO-AI news)", accept: "application/rss+xml, application/xml, text/xml, */*" }, cf: { cacheTtl: 600, cacheEverything: true } });
      const items = r.ok ? parseFeed(await r.text(), pub) : [];
      if (report) report.push({ pub, url: u, status: r.status, n: items.length });
      return items;
    } catch (e) { if (report) report.push({ pub, url: u, status: 0, n: 0, err: String(e.message || e).slice(0, 80) }); return []; }
  }))).flat();
  return all;
}
async function newsRefs(q, report) {
  const all = await rssNews(report);
  const seen = new Set();
  const uniq = all.filter((x) => { const k = x.title.replace(/\s/g, "").slice(0, 30); if (seen.has(k)) return false; seen.add(k); return true; });
  const toks = newsTokens(q);
  let pick;
  if (toks.length) {
    pick = uniq.map((x) => ({ x, sc: toks.reduce((a, w) => a + (x.title.includes(w) ? 2 : 0) + (x.extract.includes(w) ? 1 : 0), 0) }))
      .filter((o) => o.sc > 0).sort((a, b) => b.sc - a.sc || b.x.ts - a.x.ts).slice(0, 6).map((o) => o.x);
  } else {
    // 주제가 없으면 언론사별로 골고루 최신 기사
    const by = {}; for (const x of uniq.sort((a, b) => b.ts - a.ts)) (by[x.publisher] = by[x.publisher] || []).push(x);
    pick = []; for (let i = 0; i < 2; i++) for (const k of Object.keys(by)) if (by[k][i] && pick.length < 6) pick.push(by[k][i]);
    pick.sort((a, b) => b.ts - a.ts);
  }
  const kst = (ts) => (ts ? new Date(ts + 9 * 3600e3).toISOString().slice(0, 10) : "");
  return pick.map((x) => ({ ...x, date: kst(x.ts), sum: x.extract, extract: `${x.publisher} ${kst(x.ts)} — ${x.title}${x.extract ? ". " + x.extract : ""}` }));
}
async function chat(req, env, url, ctx) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  const tStart = Date.now();
  const lurl = env.LLAMA_API_KEY ? await llamaUrl(env) : "";
  if (!lurl && (!env.MODEL_URL || !env.MODEL_KEY)) return json({ error: "모델이 아직 연결되지 않았어요", noModel: true }, 503);
  const verSel = !lurl && env.ADMIN_KV ? String((await env.ADMIN_KV.get("config:model_version")) || "").slice(0, 40) : "";
  const u = await tokenUser(req, env);
  if (!u) return json({ error: "로그인이 필요해요" }, 401);
  const isAdmin = String(u.email || "").toLowerCase() === String(env.ADMIN_EMAIL || ADMIN_DEFAULT).toLowerCase() && !!u.emailVerified;
  if (saOf(env) && !isAdmin) {
    const m = await getMod(env, u.localId);
    if (m.banned || (m.tempBan && (m.bannedUntil || 0) > Date.now())) return json({ error: "사용이 제한된 계정이에요" }, 403);
  }
  let b = {}; try { b = await req.json(); } catch {}
  const q = String(b.q || "").trim().slice(0, 500);
  if (!q && (b.task === undefined || b.task === "ask" || b.task === "agent" || b.task === "code")) return json({ error: "질문을 적어 주세요" }, 400);
  if (env.ADMIN_KV && !isAdmin) {
    const k = `chat:${u.localId}:${day()}`;
    const n = parseInt((await env.ADMIN_KV.get(k)) || "0", 10);
    if (n >= CHAT_DAILY) return json({ error: `하루 ${CHAT_DAILY}번까지 물어볼 수 있어요`, limit: true }, 429);
    await env.ADMIN_KV.put(k, String(n + 1), { expirationTtl: 172800 });
  }
  bump(env, ctx, "chat");
  const task = ["ask", "agent", "translate", "summary", "code"].includes(b.task) ? b.task : "ask";
  let refs = [], system = FACT_SYS, user = "", maxTok = 400, newsMode = false;
  // 앞 대화(최근 몇 줄)로 "어떤 처벌을 해?" 같은 짧은 후속 질문도 이해하게 해요
  const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-6).map((h) => ({ r: h && h.r === "a" ? "a" : "u", t: String((h && h.t) || "").replace(/\s+/g, " ").slice(0, 300) })).filter((h) => h.t);
  const lastU = [...hist].reverse().find((h) => h.r === "u");
  const sq = lastU && q.length <= 30 ? (lastU.t.slice(0, 120) + " " + q).slice(0, 500) : q;
  const ctxIn = String(b.ctx || "").trim().slice(0, b.task === "code" ? 6000 : b.page ? 8000 : 3000);
  const histTxt = (ctxIn && b.task !== "agent" ? "첨부한 글:\n" + ctxIn + "\n\n" : "") + (hist.length ? "이전 대화:\n" + hist.map((h) => (h.r === "u" ? "사용자: " : "LAGO: ") + h.t).join("\n") + "\n\n" : "");
  if (task === "ask") {
    // 1순위: Kaggle 서버의 검색 DB(위키·뉴스·법령·판례…)로 답하기 (/ask). 없거나 아직 올리는 중이면 아래 위키백과 방식으로 대신해요.
    const shapeRefs = (arr) => (Array.isArray(arr) ? arr : []).slice(0, 8).map((x) => ({
      n: +x.n || 0, title: String(x.title || "").slice(0, 120), url: /^https?:\/\//.test(x.url || "") ? String(x.url).slice(0, 300) : "",
      db: String(x.db || "").slice(0, 20), date: String(x.date || "").slice(0, 10), publisher: String(x.publisher || "").slice(0, 40),
    }));
    if (b.stream && !lurl) {   // 찾는 중인 자료를 먼저 보내 주는 방식 (/ask_stream). 안 되면 아래 일반 방식으로 넘어가요.
      const acs = new AbortController();
      const ts = setTimeout(() => acs.abort(), 90000);
      try {
        const rs = await fetch(env.MODEL_URL + "/ask_stream", {
          method: "POST", signal: acs.signal,
          headers: { "content-type": "application/json", "x-key": env.MODEL_KEY, "user-agent": UA },
          body: JSON.stringify({ q, sq, hist_txt: histTxt, max_new_tokens: maxTok, version: verSel }),
        });
        if (rs.ok && rs.body) {
          const enc = new TextEncoder(), dec = new TextDecoder();
          const out = new ReadableStream({
            async start(ctrl) {
              const send = (o) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
              const rd = rs.body.getReader(); let buf = "", fin = false;
              try {
                for (;;) {
                  const { done, value } = await rd.read();
                  if (value) buf += dec.decode(value, { stream: true });
                  let i;
                  while ((i = buf.indexOf("\n")) >= 0) {
                    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
                    if (!line) continue;
                    let m; try { m = JSON.parse(line); } catch { continue; }
                    if (m.t === "refs") send({ t: "refs", refs: shapeRefs(m.refs) });
                    else if (m.t === "done") {
                      const a = String(m.answer || "").replace(/https?:\/\/\S+/g, "(링크 확인 불가)").trim().slice(0, 4000);
                      if (!a) { send({ t: "error", error: "빈 답이 왔어요" }); fin = true; break; }
                      const rf = shapeRefs(m.refs);
                      const c2 = [...new Set([...a.matchAll(/\[(\d)\]/g)].map((x) => +x[1]))].filter((n) => n >= 1 && n <= rf.length);
                      send({ t: "done", answer: a, task, sources: rf.map((x) => ({ ...x, cited: c2.includes(x.n) })), refs: rf.length, dbs: [...new Set(rf.map((x) => x.db))], viaDb: true });
                      fin = true;
                    }
                  }
                  if (done || fin) break;
                }
                if (!fin) send({ t: "error", error: "모델 서버 응답이 끊겼어요" });
              } catch (e) { send({ t: "error", error: "모델 서버 연결이 끊겼어요" }); }
              clearTimeout(ts); ctrl.close();
            },
          });
          return new Response(out, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
        }
      } catch (e) { /* 일반 방식으로 */ }
      clearTimeout(ts);
    }
    const ac0 = new AbortController();
    const t0 = setTimeout(() => ac0.abort(), 90000);
    try {
      if (lurl) throw new Error("llama");
      const r0 = await fetch(env.MODEL_URL + "/ask", {
        method: "POST", signal: ac0.signal,
        headers: { "content-type": "application/json", "x-key": env.MODEL_KEY, "user-agent": UA },
        body: JSON.stringify({ q, sq, hist_txt: histTxt, max_new_tokens: maxTok, version: verSel }),
      });
      if (r0.ok) {
        const d0 = await r0.json();
        const ans0 = String(d0.answer || "").replace(/https?:\/\/\S+/g, "(링크 확인 불가)").trim().slice(0, 4000);
        if (ans0) {
          const rf = (Array.isArray(d0.refs) ? d0.refs : []).slice(0, 8).map((x) => ({
            n: +x.n || 0, title: String(x.title || "").slice(0, 120), url: /^https?:\/\//.test(x.url || "") ? String(x.url).slice(0, 300) : "",
            db: String(x.db || "").slice(0, 20), date: String(x.date || "").slice(0, 10), publisher: String(x.publisher || "").slice(0, 40),
          }));
          const cited0 = [...new Set([...ans0.matchAll(/\[(\d)\]/g)].map((m) => +m[1]))].filter((n) => n >= 1 && n <= rf.length);
          return json({ answer: ans0, task, sources: rf.map((x) => ({ ...x, cited: cited0.includes(x.n) })), refs: rf.length, dbs: [...new Set(rf.map((x) => x.db))], viaDb: true });
        }
      } else if (r0.status !== 404 && r0.status !== 503) {
        return json({ error: "모델이 응답하지 못했어요 (" + r0.status + ")", modelDown: true }, 502);
      }
    } catch (e) { /* 모델 서버 연결 문제는 아래 /generate 에서 다시 확인해요 */ }
    finally { clearTimeout(t0); }
    if (NEWS_RE.test(q)) { try { refs = (await newsRefs(sq)).slice(0, 4); newsMode = refs.length > 0; } catch {} }
    if (!refs.length) { try { refs = (await wiki(sq)).results || []; } catch {} }
    if (ctxIn) refs.unshift({ title: "첨부한 글", extract: ctxIn, url: "", att: true });
    // 뉴스도 학습한 형식 "[번호] [제목] 내용" 그대로, 짧게만 (태블릿은 읽는 시간이 길어요)
    const ctxText = refs.length ? refs.map((x, i) => newsMode ? `[${i + 1}] [${x.title}] ${x.publisher} ${x.date}. ${String(x.sum || "").slice(0, 160)}` : `[${i + 1}] [${x.title}] ${String(x.extract).slice(0, 700)}`).join("\n") : "(검색된 자료 없음)";
    user = `참고자료:\n${ctxText}\n\n${newsMode ? "" : histTxt.replace(/^첨부한 글:[\s\S]*?\n\n/, "")}질문: ${q}`;
    if (newsMode) maxTok = 160;
  } else if (task === "code") {
    // CODE 영역: 코드를 쓰고 고쳐요. 작업 폴더의 파일 목록·내용(ctx)을 함께 받아요.
    system = "너는 LAGO CODE다. 요청에 맞는 코드를 쓰거나 고쳐라. 코드는 ```언어 코드블록에 넣고, 설명은 짧게 한국어로 써라. " +
      "실행해야 할 명령이 있으면 ```bash 블록에 따로 써라. 폴더 자료가 주어지면 그 파일 이름과 내용에 맞춰라. 모르는 것은 지어내지 마라.";
    user = (ctxIn ? "작업 폴더:\n" + ctxIn + "\n\n" : "") + (hist.length ? "이전 대화:\n" + hist.map((h) => (h.r === "u" ? "사용자: " : "LAGO: ") + h.t).join("\n") + "\n\n" : "") + "요청: " + q;
    maxTok = 900;
  } else if (task === "agent") {
    const ag = b.agent || {};
    const nm = String(ag.name || "에이전트").slice(0, 40), ins = String(ag.instructions || "").slice(0, 1500);
    if (!ins) return json({ error: "에이전트 지시문이 비어 있어요" }, 400);
    system = `너는 LAGO AI의 '${nm}' 에이전트다. 아래 지시를 따라 한국어로 짧고 정확하게 답하라. 모르는 것은 모른다고 말하라. URL을 직접 쓰지 마라.\n지시: ${ins}`;
    if (b.tool) {
      system += "\n이것은 도구다. 사용자가 보낸 [입력]은 질문이나 대화가 아니라 지시대로 처리할 대상이다. 입력(‘이름: ’ 뒤의 글)에 답하거나 동의하지 말고, 지시에 맞는 결과만 출력하라. '네', '알겠어요' 같은 말이나 인사, 원문 표시를 붙이지 마라.";
      user = `${nm}: ${ctxIn || q}`;
    } else user = ctxIn || q;
  } else {
    const text = String(b.text || "").trim().slice(0, task === "translate" ? 1500 : 3000);
    if (!text) return json({ error: "글이 비어 있어요" }, 400);
    if (task === "translate") {
      const lang = ["한국어", "영어", "일본어", "중국어", "스페인어"].includes(b.lang) ? b.lang : "영어";
      system = `너는 번역가다. 주어진 글을 ${lang}로 자연스럽게 번역하라. 번역문만 출력하고 설명이나 덧붙임은 쓰지 마라. 원문에 없는 내용은 추가하지 마라.`;
      user = text; maxTok = 600;
    } else {
      const len = ["3줄", "5줄", "한 문단"].includes(b.len) ? b.len : "3줄";
      system = `너는 요약가다. 주어진 글의 내용만 한국어로 ${len === "한 문단" ? "한 문단" : len}로 요약하라. 글에 없는 내용은 절대 추가하지 마라.`;
      user = text; maxTok = 400;
    }
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20 * 60 * 1000);   // 사실상 제한 없음(20분). 태블릿이 느려도 기다려요.
  const payload = (d) => {
    const ans = String((d && d.answer) || "").replace(/https?:\/\/\S+/g, "(링크 확인 불가)").trim().slice(0, 4000);
    if (!ans) return null;
    const cited = [...new Set([...ans.matchAll(/\[(\d)\]/g)].map((m) => +m[1]))].filter((n) => n >= 1 && n <= refs.length);
    if (ctx && !b.kid) ctx.waitUntil(logChat(env, { t: Date.now(), q: cap(b.q || b.message || "", 300), a: cap(ans, 1500), ms: Date.now() - tStart, task, news: newsMode }));
    return { answer: ans, task, sources: refs.map((x, i) => ({ n: i + 1, title: x.title, url: x.url, db: x.att ? "첨부" : (x.db || "위키백과"), publisher: x.publisher || "", date: x.date || "", cited: cited.includes(i + 1) })), refs: refs.length, ...(d && d.used && d.used.length ? { tools: d.used } : {}), ...(mcpList.fail && mcpList.fail.length ? { mcpErr: mcpList.fail } : {}), ...(refs.some((x) => x.db === "뉴스") ? { viaDb: true, dbs: ["뉴스"] } : {}) };
  };
  const newsAnswer = () => "관련 기사를 찾았어요.\n" + refs.map((x, i) => `${i + 1}. ${x.title} (${x.publisher}${x.date ? " " + x.date.slice(5) : ""}) [${i + 1}]`).join("\n");
  const noInfo = (a) => /제공된 자료에는 해당 내용이 없습니다/.test(String(a || ""));
  const richAsk = /표로|표 |차트|그래프|막대|원그래프|꺾은선|수식|공식|방정식|\b(chart|graph|table|plot|pie|bar|equation|formula|latex)\b/i.test(String(b.q || b.message || ""));
  if (richAsk && task === "ask") { system += "\n\n[서식] 표는 마크다운 표(| 열 | 열 |)로 써라. 그래프는 ```chart 코드블록 안에 JSON 한 개만 써라: {\"type\":\"bar|line|pie\",\"title\":\"제목\",\"labels\":[\"A\",\"B\"],\"data\":[1,2]} (여러 계열은 \"series\":[{\"name\":\"이름\",\"data\":[..]}]). 수식은 LaTeX를 $...$ 또는 $$...$$ 로 써라. 강조는 **굵게**, *기울임*을 써라. 지어낸 숫자는 쓰지 마라."; if (maxTok < 700) maxTok = 700; }
  if (b.lang === "en" && task !== "translate") system += "\n\nIMPORTANT: Write the whole answer in English, even if the question or the sources are in Korean. Keep source numbers like [1] as they are.";
  if (b.lang === "en" && task !== "translate") { user += "\n\n(Answer in English only.)"; if (maxTok < 600) maxTok = 600; }
  // 뉴스 질문은 모델을 거치지 않고 (태블릿이 기사를 읽는 데 몇 분 걸려요) 바로 기사 목록을 보여 줘요 (빠르고 정확해요)
  if (newsMode && task === "ask") { const pl = payload({ answer: newsAnswer() }); if (pl) return json({ ...pl, direct: true }); }
  if (lurl && !newsMode) await ensureLora(env, lurl);
  const mcpSrv = lurl && task === "ask" && !newsMode ? await userServers(env, u.localId) : [];
  const mcpList = mcpSrv.length ? await serverTools(mcpSrv) : [];
  const mcpOpts = { allow: new Set(mcpSrv.allow || []), ok: (Array.isArray(b.mcpOk) ? b.mcpOk : []).slice(0, 3).filter((x) => x && typeof x.tool === "string").map((x) => ({ tool: x.tool.slice(0, 100), args: x.args && typeof x.args === "object" ? x.args : {} })), no: (Array.isArray(b.mcpNo) ? b.mcpNo : []).slice(0, 5).map((x) => String(x).slice(0, 100)) };
  const capTok = task === "code" ? maxTok : maxTok < (b.lang === "en" || richAsk ? 700 : 300) ? maxTok : (b.lang === "en" || richAsk ? 700 : 300);
  const callModel = async () => (mcpList.length
    ? runWithMcp((s2, u2) => llamaChat(env, lurl, s2, u2, mcpList.length ? Math.max(capTok, 500) : capTok, ac.signal, okModel(b.model)), mcpList, system, user, { ...mcpOpts, q })
    : llamaChat(env, lurl, system, user, capTok, ac.signal, okModel(b.model)));
  if (lurl && task === "ask" && b.stream) {
    // 오래 걸려도 연결이 끊기지 않게, 10초마다 빈 줄을 보내며 기다려요 (앱은 빈 줄을 무시해요)
    const { readable, writable } = new TransformStream();
    const w = writable.getWriter(), enc = new TextEncoder();
    const send = (o) => w.write(enc.encode(JSON.stringify(o) + "\n")).catch(() => {});
    const run = (async () => {
      const ka = setInterval(() => w.write(enc.encode("\n")).catch(() => {}), 10000);
      try {
        send({ t: "refs", refs: refs.map((x, i) => ({ n: i + 1, title: x.title, url: x.url, db: x.att ? "첨부" : (x.db || "위키백과") })) });
        const lr = await callModel();
        if (lr.pending) { send({ t: "pending", pending: lr.pending }); return; }
        if (lr.status) send({ t: "error", error: lr.status === 401 || lr.status === 403 ? "모델 서버 키(LLAMA_API_KEY)가 맞지 않아요" : "모델이 응답하지 못했어요 (" + lr.status + ")" });
        else { const pl = payload(newsMode && noInfo(lr.answer) ? { answer: newsAnswer() } : lr); send(pl ? { t: "done", ...pl, ...(newsMode && noInfo(lr.answer) ? { direct: true } : {}) } : { t: "error", error: "빈 답이 왔어요" }); }
      } catch { send({ t: "error", error: "모델 서버에 연결하지 못했어요. 임시 주소가 바뀌었는지 관리자 화면에서 확인해 주세요" }); }
      finally { clearInterval(ka); clearTimeout(t); w.close().catch(() => {}); }
    })();
    if (ctx && ctx.waitUntil) ctx.waitUntil(run);
    return new Response(readable, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
  }
  try {
    let d;
    if (lurl) {
      const lr = task === "ask" ? await callModel() : await llamaChat(env, lurl, system, user, task === "agent" ? capTok : maxTok, ac.signal, okModel(b.model));
      if (lr.status) return json({ error: lr.status === 401 || lr.status === 403 ? "모델 서버 키(LLAMA_API_KEY)가 맞지 않아요" : "모델이 응답하지 못했어요 (" + lr.status + ")", modelDown: true }, 502);
      d = lr;
      if (d.pending) return json({ pending: d.pending, task });
    } else {
      const r = await fetch(env.MODEL_URL + "/generate", {
        method: "POST", signal: ac.signal,
        headers: { "content-type": "application/json", "x-key": env.MODEL_KEY, "user-agent": UA },
        body: JSON.stringify({ system, user, max_new_tokens: maxTok, version: verSel }),
      });
      if (!r.ok) return json({ error: "모델이 응답하지 못했어요 (" + r.status + ")", modelDown: true }, 502);
      d = await r.json();
    }
    let ans = (task === "code" ? String(d.answer || "") : String(d.answer || "").replace(/https?:\/\/\S+/g, "(링크 확인 불가)")).trim().slice(0, task === "code" ? 8000 : 4000);
    if (!ans) return json({ error: "빈 답이 왔어요", modelDown: true }, 502);
    const cited = [...new Set([...ans.matchAll(/\[(\d)\]/g)].map((m) => +m[1]))].filter((n) => n >= 1 && n <= refs.length);
    return json({ answer: ans, task, sources: refs.map((x, i) => ({ n: i + 1, title: x.title, url: x.url, db: x.att ? "첨부" : (x.db || "위키백과"), publisher: x.publisher || "", date: x.date || "", cited: cited.includes(i + 1) })), refs: refs.length, ...(d && d.used && d.used.length ? { tools: d.used } : {}), ...(mcpList.fail && mcpList.fail.length ? { mcpErr: mcpList.fail } : {}), ...(refs.some((x) => x.db === "뉴스") ? { viaDb: true, dbs: ["뉴스"] } : {}) });
  } catch (e) {
    return json({ error: lurl ? "모델 서버에 연결하지 못했어요. 임시 주소가 바뀌었는지 관리자 화면에서 확인해 주세요" : "모델 서버에 연결하지 못했어요", modelDown: true }, 502);
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

// ---- 보안: 내 계정에 접속한 기기 목록 (KV sec:<uid>) ----
// 기기마다 브라우저가 만든 임의 번호(sid)로 구분해요. IP·지역은 Cloudflare가 알려 주는 값만 믿고, 기기 종류·이름은 앱이 보낸 값을 짧게 잘라 써요.
const SEC_KINDS = ["web", "app", "android", "cli", "ext"];
async function secApi(req, env, url, p) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin && !/^chrome-extension:\/\//.test(origin)) return json({ error: "허용되지 않은 요청이에요" }, 403);
  const u = await tokenUser(req, env);
  if (!u) return json({ error: "로그인이 필요해요" }, 401);
  const key = "sec:" + u.localId;
  let d = {};
  try { d = JSON.parse((await env.ADMIN_KV.get(key)) || "{}"); } catch {}
  d.sessions = Array.isArray(d.sessions) ? d.sessions : [];
  d.events = Array.isArray(d.events) ? d.events : [];
  const save = () => env.ADMIN_KV.put(key, JSON.stringify(d), { expirationTtl: 90 * 86400 });
  const view = (sid) => ({
    sessions: d.sessions.filter((x) => !x.revoked).sort((a, b) => b.last - a.last).map((x) => ({ ...x, me: x.id === sid })),
    events: d.events.slice(0, 30),
  });
  if (p === "/api/security/ping" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    const sid = String(b.sid || "").replace(/[^a-z0-9]/gi, "").slice(0, 24);
    if (sid.length < 8) return json({ error: "기기 번호가 없어요" }, 400);
    const now = Date.now();
    const cf = req.cf || {};
    const ip = req.headers.get("cf-connecting-ip") || "?";
    const where = [cf.city, cf.country].filter(Boolean).join(", ");
    let s = d.sessions.find((x) => x.id === sid);
    if (s && s.revoked) return json({ revoked: true });
    const kind = SEC_KINDS.includes(b.kind) ? b.kind : "web";
    const info = { kind, os: cap(b.os || "", 40), app: cap(b.app || "", 40), ip, where, last: now };
    if (!s) {
      s = { id: sid, first: now, ...info };
      d.sessions.push(s);
      d.events.unshift({ at: now, type: "login", kind, os: info.os, app: info.app, ip, where });
      d.sessions = d.sessions.sort((a, b2) => b2.last - a.last).slice(0, 20);
      d.events = d.events.slice(0, 40);
    } else {
      if (s.ip !== ip) d.events.unshift({ at: now, type: "ip", kind, os: info.os, app: info.app, ip, where });
      Object.assign(s, info);
    }
    await save();
    return json(view(sid));
  }
  if (p === "/api/security/list" && req.method === "GET") return json(view(url.searchParams.get("sid") || ""));
  if (p === "/api/security/revoke" && req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    const keep = String(b.keep || "");
    let n = 0;
    for (const s of d.sessions) {
      if (s.revoked) continue;
      if (b.all ? s.id !== keep : s.id === b.id) { s.revoked = Date.now(); n++; d.events.unshift({ at: Date.now(), type: "revoke", kind: s.kind, os: s.os, app: s.app, ip: s.ip, where: s.where }); }
    }
    d.events = d.events.slice(0, 40);
    await save();
    return json({ ok: true, n, ...view(keep) });
  }
  return json({ error: "없는 주소예요" }, 404);
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

// ---------- MCP 연결 API (로그인한 사용자) ----------
async function mcpApi(req, env, url) {
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "허용되지 않은 요청이에요" }, 403);
  if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
  const u = await tokenUser(req, env);
  if (!u) return json({ error: "로그인이 필요해요" }, 401);
  const kget = async (k, d) => { try { return JSON.parse((await env.ADMIN_KV.get(k)) || "null") ?? d; } catch { return d; } };
  const stKey = "umcp:" + u.localId, st = await kget(stKey, {}); st.off = st.off || []; st.custom = st.custom || []; st.dev = st.dev || [];
  const save = () => env.ADMIN_KV.put(stKey, JSON.stringify(st));
  const p = url.pathname;
  let b = {}; if (req.method === "POST") { try { b = await req.json(); } catch {} }
  if (p === "/api/mcp/list" && req.method === "GET") {
    const defs = (await kget("mcp:default", [])).filter((d) => d.enabled !== false);
    const dev = []; for (const id of st.dev) { const d = await kget("tool:" + id, null); if (d && d.kind === "mcp" && !d.hidden) dev.push({ id, name: d.name, desc: d.desc || "", tools: (d.mcpTools || {}).n || 0 }); }
    return json({ defaults: defs.map((d) => ({ id: d.id, name: d.name, desc: d.desc || "", on: !st.off.includes(d.id) })), custom: st.custom.map((c) => ({ id: c.id, name: c.name, url: maskUrl(c.url), on: c.on !== false, auth: !!c.token, risk: mcpRisk(c.url).warn })), dev, allow: st.allow || [] });
  }
  if (req.method !== "POST") return json({ error: "POST만 돼요" }, 405);
  if (p === "/api/mcp/toggle") {
    const id = cap(b.id, 20), on = !!b.on;
    if (b.kind === "custom") { const c = st.custom.find((x) => x.id === id); if (!c) return json({ error: "없는 커넥터예요" }, 404); c.on = on; }
    else { st.off = st.off.filter((x) => x !== id); if (!on) st.off.push(id); }
    await save(); return json({ ok: true });
  }
  if (p === "/api/mcp/add") {
    if (st.custom.length >= 5) return json({ error: "내 커넥터는 5개까지예요" }, 400);
    const rk = mcpRisk(b.url);
    if (rk.block) return json({ error: rk.block, block: true, url: maskUrl(b.url) }, 400);
    if (rk.warn.length && !b.ack) return json({ error: "주소에 주의가 필요해요", needAck: true, risk: rk.warn, url: maskUrl(b.url) }, 400);
    if (st.custom.some((c) => c.url === b.url)) return json({ error: "이미 추가한 주소예요" }, 400);
    let tl; try { tl = await mcpTools({ url: b.url, token: cap(b.token, 400) }, true); } catch (e) { return json({ error: "연결하지 못했어요: " + String(e.message || e).slice(0, 140) }, 400); }
    if (!tl.length) return json({ error: "연결됐지만 쓸 수 있는 도구가 없어요" }, 400);
    const c = { id: "c" + rid().slice(0, 6), name: cap(b.name, 30).trim() || new URL(b.url).hostname, url: b.url, token: cap(b.token, 400), on: true };
    st.custom.push(c); await save(); return json({ ok: true, id: c.id, tools: tl.map((t) => t.name).slice(0, 12), n: tl.length });
  }
  if (p === "/api/mcp/addDev") {
    const id = cap(b.id, 16); const d = await kget("tool:" + id, null);
    if (!d || d.kind !== "mcp" || d.hidden) return json({ error: "없는 MCP예요" }, 404);
    const ae = await audCheck(req, env, d); if (ae) return ae;
    if (st.dev.length >= 5) return json({ error: "DEV에서 가져온 MCP는 5개까지예요" }, 400);
    if (!st.dev.includes(id)) st.dev.push(id);
    await save(); return json({ ok: true });
  }
  if (p === "/api/mcp/allow") {
    const key = cap(b.key, 120); st.allow = (st.allow || []).filter((x) => x !== key);
    if (b.on !== false) { if (st.allow.length >= 50) return json({ error: "항상 허용은 50개까지예요" }, 400); st.allow.push(key); }
    await save(); return json({ ok: true });
  }
  if (p === "/api/mcp/remove") {
    const id = cap(b.id, 20);
    if (b.kind === "dev") st.dev = st.dev.filter((x) => x !== id); else st.custom = st.custom.filter((x) => x.id !== id);
    await save(); return json({ ok: true });
  }
  return json({ error: "없는 경로예요" }, 404);
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
const SECRET_NAMES = ["RESEND_API_KEY", "MAIL_FROM", "DATA_GO_KR_KEY", "FIREBASE_SERVICE_ACCOUNT", "MODEL_URL", "MODEL_KEY", "LLAMA_API_KEY", "MODEL_REGISTER_KEY"];
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
  return { kv: !!env.ADMIN_KV, firebase: !!raw.FIREBASE_CONFIG, secrets, days, apis, llama: { url: await llamaUrl(env) } };
}
// 태블릿(Termux)이 켜질 때마다 새 임시 주소를 알려 주는 입구. 관리자 로그인 대신 X-Register-Key 로 확인해요.
async function registerModelUrl(req, env) {
  const key = env.MODEL_REGISTER_KEY || "";
  const got = req.headers.get("x-register-key") || "";
  let diff = key.length ^ got.length;
  for (let i = 0; i < Math.max(key.length, got.length); i++) diff |= (key.charCodeAt(i) || 0) ^ (got.charCodeAt(i) || 0);
  if (!key || diff !== 0) return json({ error: "등록 키가 맞지 않아요" }, 401);
  if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
  let b = {}; try { b = await req.json(); } catch {}
  const v = String(b.url || "").trim().replace(/\/+$/, "");
  if (!okLlamaUrl(v) || !/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.trycloudflare\.com$/i.test(v)) return json({ error: "https://….trycloudflare.com 같은 주소만 받아요" }, 400);
  await env.ADMIN_KV.put("config:llama_url", v);
  return json({ ok: true, url: v });
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
  if (p === "/api/admin/mcp") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    let defs = []; try { defs = JSON.parse((await env.ADMIN_KV.get("mcp:default")) || "[]"); } catch {}
    const view = () => defs.map((d) => ({ id: d.id, name: d.name, desc: d.desc || "", url: maskUrl(d.url), enabled: d.enabled !== false, auth: !!d.token, risk: mcpRisk(d.url).warn }));
    if (req.method === "GET") return json({ items: view() });
    let b = {}; try { b = await req.json(); } catch {}
    if (b.action === "test") {
      const srv = b.id ? defs.find((d) => d.id === b.id) : { url: String(b.url || ""), token: String(b.token || "") };
      if (!srv || !okMcpUrl(srv.url)) return json({ error: "주소가 올바르지 않아요 (https://, 포트·IP 불가)" }, 400);
      try { const tl = await mcpTools(srv, true); return json({ ok: true, tools: tl.map((t) => ({ name: t.name, desc: t.description })) }); } catch (e) { return json({ error: String(e.message || e).slice(0, 160) }, 400); }
    }
    if (b.action === "delete") { defs = defs.filter((d) => d.id !== b.id); await env.ADMIN_KV.put("mcp:default", JSON.stringify(defs)); return json({ ok: true, items: view() }); }
    if (b.action === "save") {
      { const old = b.id && defs.find((x) => x.id === b.id); if (old && b.url === maskUrl(old.url)) b.url = old.url; }
      const rk = mcpRisk(b.url);
      if (rk.block) return json({ error: rk.block, block: true, url: maskUrl(b.url) }, 400);
      if (rk.warn.length && !b.ack && !(b.id && defs.find((x) => x.id === b.id && x.url === b.url))) return json({ error: "주소에 주의가 필요해요", needAck: true, risk: rk.warn, url: maskUrl(b.url) }, 400);
      const name = cap(b.name, 30).trim(); if (!name) return json({ error: "이름을 적어 주세요" }, 400);
      let d = b.id && defs.find((x) => x.id === b.id);
      if (!d) { if (defs.length >= 10) return json({ error: "기본 MCP는 10개까지예요" }, 400); d = { id: "s" + rid().slice(0, 6) }; defs.push(d); }
      d.name = name; d.desc = cap(b.desc, 100); d.url = b.url; d.enabled = b.enabled !== false;
      if (typeof b.token === "string" && b.token.trim()) d.token = b.token.trim().slice(0, 400); else if (b.clearToken) d.token = "";
      await env.ADMIN_KV.put("mcp:default", JSON.stringify(defs)); return json({ ok: true, items: view() });
    }
    return json({ error: "알 수 없는 동작이에요" }, 400);
  }
  if (p === "/api/admin/dev" && req.method === "GET") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const devs = [], items = []; const cnt = {};
    let cur;
    for (let n = 0; n < 5; n++) {
      const l = await env.ADMIN_KV.list({ prefix: "tool:", cursor: cur, limit: 200 });
      for (const k of l.keys) {
        const o = await env.ADMIN_KV.get(k.name); if (!o) continue;
        let d; try { d = JSON.parse(o); } catch { continue; }
        if (!d.viaDev) continue;
        cnt[d.owner] = (cnt[d.owner] || 0) + 1;
        items.push({ id: k.name.slice(5), kind: d.kind || "tool", name: d.name, desc: d.desc || "", owner: d.ownerName || "", ownerUid: d.owner, at: d.at || 0, runs: d.runs || 0, cover: !!d.cover, hidden: !!d.hidden, restricted: !!(d.emails && d.emails.length) });
      }
      if (l.list_complete) break; cur = l.cursor;
    }
    cur = undefined;
    for (let n = 0; n < 5; n++) {
      const l = await env.ADMIN_KV.list({ prefix: "dev:", cursor: cur, limit: 200 });
      for (const k of l.keys) {
        const o = await env.ADMIN_KV.get(k.name); if (!o) continue;
        let d; try { d = JSON.parse(o); } catch { continue; }
        const uid = k.name.slice(4);
        devs.push({ uid, name: d.name || "", email: d.email || "", at: d.at || 0, count: cnt[uid] || 0 });
      }
      if (l.list_complete) break; cur = l.cursor;
    }
    items.sort((x, y) => y.at - x.at); devs.sort((x, y) => y.at - x.at);
    return json({ devs, items: items.slice(0, 200) });
  }
  if (req.method !== "POST") return json({ error: "POST만 돼요" }, 405);
  let b = {};
  try { b = await req.json(); } catch {}
  if (p === "/api/admin/dev/item") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const id = String(b.id || ""); if (!/^[a-z0-9]{6,16}$/.test(id)) return json({ error: "잘못된 번호예요" }, 400);
    const key = "tool:" + id, o = await env.ADMIN_KV.get(key);
    if (!o) return json({ error: "이미 없어요" }, 404);
    if (b.action === "remove") { await env.ADMIN_KV.delete(key); return json({ ok: true }); }
    if (b.action === "hide" || b.action === "show") { const d = JSON.parse(o); d.hidden = b.action === "hide"; await env.ADMIN_KV.put(key, JSON.stringify(d)); return json({ ok: true }); }
    return json({ error: "알 수 없는 동작이에요" }, 400);
  }
  if (p === "/api/admin/dev/revoke") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const uid = String(b.uid || ""); if (!uid || uid.length > 128) return json({ error: "잘못된 사용자예요" }, 400);
    await env.ADMIN_KV.delete("dev:" + uid);
    return json({ ok: true });
  }
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
  if (p === "/api/admin/notice") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const t = String(b.title || "").trim().slice(0, 80), body = String(b.body || "").trim().slice(0, 1500);
    if (!t) { await env.ADMIN_KV.delete("config:notice"); return json({ ok: true, cleared: true }); }
    const n = { id: Date.now().toString(36), title: t, body };
    await env.ADMIN_KV.put("config:notice", JSON.stringify(n));
    return json({ ok: true, notice: n });
  }
  if (p === "/api/admin/model") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const base = await llamaUrl(env);
    const sel = (await env.ADMIN_KV.get("config:model_version")) || "fonte_1.0";
    if (req.method === "POST" && (b.reload || b.version)) {
      if (!hasBackend(env, base)) return json({ error: "서버 주소·키를 먼저 넣어 주세요" }, 400);
      const ver = b.reload ? sel : String(b.version || "");
      if (!VERS.some((x) => x.id === ver)) return json({ error: "없는 버전이에요" }, 400);
      loraKey = "";
      const r = await backendApply(env, base, ver);
      if (!r.ok) return json({ error: r.msg }, 502);
      await env.ADMIN_KV.put("config:model_version", ver);
      loraKey = base + "|" + ver;
    }
    const cur = (await env.ADMIN_KV.get("config:model_version")) || "fonte_1.0";
    const st = await backendState(env, base);
    return json({ ok: true, selected: cur, server: !!st.ok, msg: st.ok ? "" : st.msg, versions: VERS.map((v) => ({ id: v.id, label: v.label, note: v.note, loaded: !!(st.ok && st.loaded.includes(v.id)), active: cur === v.id })) });
  }
  if (p === "/api/admin/chatdata") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    const n = Math.min(40, Math.max(1, parseInt(url.searchParams.get("n") || "20", 10) || 20));
    const ls = await env.ADMIN_KV.list({ prefix: "clog:", limit: n });
    const items = (await Promise.all(ls.keys.map(async (k) => { try { return JSON.parse(await env.ADMIN_KV.get(k.name)); } catch { return null; } }))).filter(Boolean);
    return json({ items, more: !ls.list_complete });
  }
  if (p === "/api/admin/llama" || p === "/api/admin/llama/test") {
    if (!env.ADMIN_KV) return json({ error: "ADMIN_KV가 연결되지 않았어요" }, 503);
    if (p === "/api/admin/llama") {
      const v = String(b.url || "").trim().replace(/\/+$/, "");
      if (!v) { await env.ADMIN_KV.delete("config:llama_url"); return json({ ok: true, url: "" }); }
      if (!okLlamaUrl(v)) return json({ error: "https://….trycloudflare.com 같은 주소를 넣어 주세요" }, 400);
      await env.ADMIN_KV.put("config:llama_url", v);
      return json({ ok: true, url: v });
    }
    const base = await llamaUrl(env);
    if (!base) return json({ error: "주소를 먼저 저장해 주세요" }, 400);
    const out = { url: base, keySet: !!env.LLAMA_API_KEY };
    const t0 = Date.now(), ac = new AbortController(), tm = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch(base + "/health", { signal: ac.signal, headers: { "user-agent": UA } });
      const txt = (await r.text()).slice(0, 200);
      out.health = r.ok; out.status = r.status; out.ms = Date.now() - t0;
      out.msg = r.ok ? "서버가 켜져 있어요" : r.status === 503 ? "모델을 올리는 중이에요" : "응답 " + r.status + " " + txt;
      if (r.ok && !env.LLAMA_API_KEY) out.msg += " · 키(LLAMA_API_KEY)는 아직 없어요";
    } catch { out.health = false; out.msg = "연결하지 못했어요. 서버가 꺼졌거나 임시 주소가 바뀌었을 수 있어요"; }
    clearTimeout(tm);
    return json(out);
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
    { const hm = p.match(/^\/h\/([a-z0-9]{6,16})$/); if (hm && req.method === "GET" && env.ADMIN_KV) { const o = await env.ADMIN_KV.get("html:" + hm[1]); if (!o) return new Response("공개가 끝났거나 없는 페이지예요", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } }); return htmlPage(JSON.parse(o).code); } }
    if (!p.startsWith("/api/")) { const ar = await env.ASSETS.fetch(req); if (p.startsWith("/s/") || p.startsWith("/t/")) { const h = new Headers(ar.headers); h.set("x-robots-tag", "noindex"); return new Response(ar.body, { status: ar.status, headers: h }); } return ar; }
    try {
      if (p === "/api/tasks/sync") return req.method === "POST" ? await tasksSync(req, env, url) : json({ error: "POST만 돼요" }, 405);
      if (p.startsWith("/api/security/")) return await secApi(req, env, url, p);
      if (p === "/api/me") return req.method === "GET" ? await me(req, env, url) : json({ error: "GET만 돼요" }, 405);
      if (p === "/api/admin/model-url") return req.method === "POST" ? await registerModelUrl(req, env) : json({ error: "POST만 돼요" }, 405);
      if (p.startsWith("/api/mcp/")) return await mcpApi(req, env, url);
      if (p.startsWith("/api/admin/")) return await adminApi(req, env, ctx, url, raw);
      if (p === "/api/kid-consent") return req.method === "POST" ? (bump(env, ctx, "kidConsent"), await kidConsent(req, env, url, ctx)) : json({ error: "POST만 돼요" }, 405);
      if (p.startsWith("/api/share") || p.startsWith("/api/tools/") || p.startsWith("/api/html/") || p.startsWith("/api/dev/")) return await shareTools(req, env, url, ctx, p);
      if (p === "/api/news") { const rep = []; const refs = await newsRefs(url.searchParams.get("q") || "오늘 뉴스", rep); return json({ feeds: rep, found: refs.length, refs: refs.map((x) => ({ title: x.title, publisher: x.publisher, date: x.date, url: x.url })) }, 200, { "cache-control": "no-store" }); }
      if (p === "/api/chat") return req.method === "POST" ? await chat(req, env, url, ctx) : json({ error: "POST만 돼요" }, 405);
      if (p === "/api/notify") return req.method === "POST" ? (bump(env, ctx, "notify"), await notify(req, env, url, ctx)) : json({ error: "POST만 돼요" }, 405);
      if (req.method !== "GET") return json({ error: "GET만 돼요" }, 405);
      if (p === "/api/update") return json(await updateInfo(env, ctx), 200, { "cache-control": "public, max-age=120" });
      if (p === "/api/config") {
        bump(env, ctx, "visits");
        return json({
          firebase: readFirebase(env),
          publicData: !!env.DATA_GO_KR_KEY,
          mail: !!env.RESEND_API_KEY,
          tasks: !!(saOf(env) && env.RESEND_API_KEY),
          wiki: true,
          fonte: env.ADMIN_KV ? String((await env.ADMIN_KV.get("config:model_version")) || "").slice(0, 20) : "",
          model: !!(env.LLAMA_API_KEY && await llamaUrl(env)) || !!(env.MODEL_URL && env.MODEL_KEY),
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
