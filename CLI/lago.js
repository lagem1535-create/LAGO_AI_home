#!/usr/bin/env node
// LAGO CLI — 터미널(CMD · PowerShell · bash)에서 쓰는 LAGO. Node 18 이상, 따로 깔 것 없음.
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const VERSION = "0.3.0";
const BASE = (process.env.LAGO_URL || "https://lago-ai-home.lagem1535.workers.dev").replace(/\/+$/, "");
const DIR = path.join(os.homedir(), ".lago");
const CFG = path.join(DIR, "config.json");
const SDIR = path.join(DIR, "sessions");
const TTY = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (n, s) => (TTY ? `\x1b[${n}m${s}\x1b[0m` : s);
const blue = (s) => c("38;5;33", s), green = (s) => c("38;5;35", s), dim = (s) => c("2", s), red = (s) => c("31", s), bold = (s) => c("1", s);
const SKIP = new Set(["node_modules", ".git", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache", ".idea", ".vscode"]);
const TXT = /\.(js|mjs|cjs|ts|jsx|tsx|py|json|md|txt|html?|css|scss|java|c|cc|cpp|h|hpp|cs|go|rs|rb|php|sh|bat|cmd|ps1|ya?ml|toml|csv|tsv|vue|svelte|kt|swift|sql|ini|cfg|xml|gradle|lua|r|dart)$/i;

const HELP = `${bold(blue("LA") + green("GO"))} CLI ${VERSION}

  lago                      대화 시작 (끝내려면 /exit)
  lago "질문"               한 번 묻고 끝내기
  lago code "요청"          지금 폴더의 파일을 보고 코드 쓰기
  lago code                 코드 대화 시작
  type 파일 | lago "요약"   파이프로 받은 글을 자료로 쓰기 (맥·리눅스: cat 파일 | lago ...)

  lago login                이메일 · 비밀번호로 로그인
  lago login --code 코드    LAGO 사이트 ‘앱 받기’에서 복사한 연결 코드로 로그인 (Google 계정)
  lago -c                   마지막 세션 이어하기 (continue)
  lago -r [번호|이름]       세션 목록에서 골라 이어하기 (resume)
  lago sessions             저장된 세션 목록
  lago logout / lago whoami / lago --version
  lago uninstall            LAGO CLI 지우기 (로그인 정보 · 설치 파일 · PATH까지)  -y 로 묻지 않고 지우기

대화 중 명령
  /code  /talk              코드 모드 · 대화 모드 바꾸기
  /file 경로                파일을 자료로 붙이기
  /save N 파일이름          방금 답의 N번째 코드 블록을 파일로 저장
  /run N                    방금 답의 N번째 명령 블록 실행 (실행 전에 물어봐요)
  /sessions  /resume [번호]  저장된 세션 보기 · 이어하기
  /new  /rename 이름  /delete  세션 새로 시작 · 이름 바꾸기 · 지우기
  /clear                    대화 기억 지우기
  /exit                     끝내기

로그인하지 않으면 위키백과에서 찾은 내용만 보여 줘요.`;

const loadCfg = () => { try { return JSON.parse(fs.readFileSync(CFG, "utf8")); } catch { return {}; } };
const saveCfg = (o) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(CFG, JSON.stringify(o, null, 2), { mode: 0o600 }); };

async function api(p, opt) {
  let r;
  try { r = await fetch(BASE + p, opt); } catch (e) { throw new Error("LAGO 서버에 연결하지 못했어요. 인터넷을 확인해 주세요."); }
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
async function apiKey() {
  const cfg = loadCfg();
  if (cfg.apiKey) return cfg.apiKey;
  const { j } = await api("/api/config");
  const k = j && j.firebase && j.firebase.apiKey;
  if (!k) throw new Error("서버에서 로그인 설정을 받지 못했어요.");
  saveCfg({ ...cfg, apiKey: k });
  return k;
}
async function gpost(url, body, form) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": form ? "application/x-www-form-urlencoded" : "application/json" }, body: form ? new URLSearchParams(body).toString() : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = (j.error && j.error.message) || "";
    const KO = { INVALID_LOGIN_CREDENTIALS: "이메일이나 비밀번호가 맞지 않아요.", INVALID_PASSWORD: "비밀번호가 맞지 않아요.", EMAIL_NOT_FOUND: "가입하지 않은 이메일이에요.", USER_DISABLED: "정지된 계정이에요.", TOKEN_EXPIRED: "로그인이 만료됐어요. 다시 로그인해 주세요.", INVALID_REFRESH_TOKEN: "연결 코드가 맞지 않아요.", USER_NOT_FOUND: "계정을 찾지 못했어요." };
    throw new Error(KO[m.split(" ")[0]] || m.startsWith("TOO_MANY_ATTEMPTS") ? (KO[m.split(" ")[0]] || "너무 많이 시도했어요. 잠시 뒤에 다시 해 주세요.") : "로그인하지 못했어요" + (m ? " (" + m + ")" : ""));
  }
  return j;
}
async function idToken() {
  const cfg = loadCfg();
  if (!cfg.refreshToken) return null;
  if (cfg.idToken && cfg.exp && Date.now() < cfg.exp - 60000) return cfg.idToken;
  const j = await gpost("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(await apiKey()), { grant_type: "refresh_token", refresh_token: cfg.refreshToken }, true);
  saveCfg({ ...loadCfg(), idToken: j.id_token, refreshToken: j.refresh_token || cfg.refreshToken, exp: Date.now() + Number(j.expires_in || 3600) * 1000 });
  return j.id_token;
}

function ask(q, hidden) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(q); };
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); res(a.trim()); });
  });
}

async function login(args) {
  const key = await apiKey();
  const ci = args.indexOf("--code");
  if (ci >= 0) {
    const code = args[ci + 1] || (await ask("연결 코드: ", true));
    const j = await gpost("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(key), { grant_type: "refresh_token", refresh_token: code }, true);
    const lk = await gpost("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(key), { idToken: j.id_token });
    const email = (lk.users && lk.users[0] && lk.users[0].email) || "";
    saveCfg({ ...loadCfg(), refreshToken: j.refresh_token || code, idToken: j.id_token, exp: Date.now() + Number(j.expires_in || 3600) * 1000, email });
    console.log(green("✓ ") + (email || "계정") + " 으로 로그인했어요.");
    return;
  }
  const email = await ask("이메일: ");
  const pw = await ask("비밀번호: ", true);
  const j = await gpost("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(key), { email, password: pw, returnSecureToken: true });
  saveCfg({ ...loadCfg(), refreshToken: j.refreshToken, idToken: j.idToken, exp: Date.now() + Number(j.expiresIn || 3600) * 1000, email: j.email });
  console.log(green("✓ ") + j.email + " 으로 로그인했어요.");
}

function walk(dir, pre, out, depth) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const d of ents) {
    if (out.length >= 400) return;
    if (SKIP.has(d.name) || d.name.startsWith(".")) continue;
    const p = pre ? pre + "/" + d.name : d.name;
    if (d.isDirectory()) { if (depth < 5) walk(path.join(dir, d.name), p, out, depth + 1); }
    else if (d.isFile()) out.push(p);
  }
}
function folderCtx(q, extra) {
  const files = []; walk(process.cwd(), "", files, 0);
  let s = "폴더: " + path.basename(process.cwd()) + "\n파일 목록:\n" + files.slice(0, 80).map((f) => "- " + f).join("\n");
  const pick = files.filter((f) => TXT.test(f) && q.includes(path.basename(f))).slice(0, 3);
  for (const f of [...new Set([...(extra || []), ...pick])].slice(0, 3)) {
    try { const st = fs.statSync(f); if (st.size < 80000) s += `\n\n[파일 ${f}]\n` + fs.readFileSync(f, "utf8").slice(0, 2500); } catch {}
  }
  return s.slice(0, 6000);
}
const blocks = (t) => [...String(t).matchAll(/```([\w+-]*)\n([\s\S]*?)```/g)].map((m) => ({ lang: m[1].toLowerCase(), code: m[2].replace(/\n$/, "") }));

function show(ans) {
  let n = 0;
  const out = String(ans).replace(/```([\w+-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    n++;
    return dim(`── [${n}] ${lang || "code"} ` + "─".repeat(Math.max(4, 40 - (lang || "code").length))) + "\n" + green(code.replace(/\n$/, "")) + "\n" + dim("─".repeat(48));
  }).replace(/\*\*([^*\n]+)\*\*/g, (_, x) => bold(x));
  console.log("\n" + out + "\n");
}

async function wikiOnly(q) {
  const { j } = await api("/api/wiki?q=" + encodeURIComponent(q.slice(0, 100)));
  if (!j.found || !j.results || !j.results.length) { console.log("\n" + dim("위키백과에서 찾지 못했어요. `lago login` 으로 로그인하면 모델이 답해요.") + "\n"); return ""; }
  const r = j.results[0];
  console.log("\n" + bold(r.title) + "\n" + (r.extract || "") + "\n" + dim((r.url || "") + "\n(로그인하지 않아 위키백과 내용만 보여 드려요 · lago login)") + "\n");
  return r.extract || "";
}


// ---------- 세션: 대화를 저장해 두고 나중에 이어서 해요 (~/.lago/sessions) ----------
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function sessAll() {
  let fl = []; try { fl = fs.readdirSync(SDIR).filter((f) => f.endsWith(".json")); } catch { return []; }
  const out = [];
  for (const f of fl) { try { const j = JSON.parse(fs.readFileSync(path.join(SDIR, f), "utf8")); if (j && j.id) out.push(j); } catch {} }
  return out.sort((a, b) => (b.updated || 0) - (a.updated || 0));
}
function sessSave(st) {
  if (!st.log || !st.log.length) return;
  if (!st.sess) st.sess = { id: rid(), created: Date.now(), title: "" };
  if (!st.sess.title) st.sess.title = String(st.log[0].q).replace(/\s+/g, " ").slice(0, 36);
  try {
    fs.mkdirSync(SDIR, { recursive: true });
    fs.writeFileSync(path.join(SDIR, st.sess.id + ".json"), JSON.stringify({ ...st.sess, cwd: process.cwd(), code: !!st.code, updated: Date.now(), log: st.log.slice(-60) }));
  } catch {}
}
function ago(t) { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 1 ? "방금" : m < 60 ? m + "분 전" : m < 1440 ? Math.round(m / 60) + "시간 전" : Math.round(m / 1440) + "일 전"; }
function sessLines(list, cur) {
  if (!list.length) return dim("  저장된 세션이 없어요.");
  return list.slice(0, 20).map((x, i) => `  ${bold(String(i + 1).padStart(2))}  ${x.title || "(제목 없음)"}${cur && cur.id === x.id ? green("  ← 지금") : ""}\n      ${dim(`${x.code ? "코드" : "대화"} · ${(x.log || []).length}번 · ${ago(x.updated)} · ${x.cwd || ""}`)}`).join("\n");
}
function sessPick(list, key) {
  if (!key) return list[0];
  const n = Number(key); if (n >= 1 && n <= list.length) return list[n - 1];
  return list.find((x) => x.id === key) || list.find((x) => (x.title || "").includes(key));
}
function sessOpen(st, x) {
  st.sess = { id: x.id, created: x.created, title: x.title };
  st.log = x.log || []; st.code = !!x.code;
  st.hist = []; for (const e of st.log.slice(-2)) st.hist.push({ r: "u", t: String(e.q).slice(0, 300) }, { r: "a", t: String(e.a).slice(0, 300) });
  st.last = (st.log[st.log.length - 1] || {}).a || "";
  if (x.cwd && x.cwd !== process.cwd()) { try { if (fs.existsSync(x.cwd)) { process.chdir(x.cwd); console.log(dim("폴더를 옮겼어요: " + x.cwd)); } } catch {} }
}
function sessRecap(st) {
  const tail = st.log.slice(-2); if (!tail.length) return;
  console.log(dim("  ── 지난 대화 ─────────────────────────────"));
  for (const e of tail) console.log("  " + blue("나 ") + String(e.q).replace(/\s+/g, " ").slice(0, 90) + "\n  " + green("LAGO ") + String(e.a).replace(/```[\s\S]*?```/g, "[코드]").replace(/\s+/g, " ").slice(0, 120));
  console.log();
}

async function chat(q, st) {
  const tok = await idToken();
  if (!tok) return st.code ? (console.log("\n" + red("코드 모드는 로그인이 필요해요.") + " lago login\n"), "") : wikiOnly(q);
  const body = { task: st.code ? "code" : "ask", q, hist: st.hist.slice(-4) };
  let ctx = st.piped || "";
  if (st.code) ctx = folderCtx(q, st.files) + (ctx ? "\n\n" + ctx : "");
  else if (st.files.length) ctx += st.files.map((f) => { try { return `\n\n[파일 ${f}]\n` + fs.readFileSync(f, "utf8").slice(0, 2500); } catch { return ""; } }).join("");
  if (ctx) body.ctx = ctx.slice(0, st.code ? 6000 : 3000);
  if (TTY) process.stdout.write(dim(st.code ? "코드 쓰는 중…" : "생각하는 중…"));
  const r = await api("/api/chat", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + tok }, body: JSON.stringify(body) });
  if (TTY) process.stdout.write("\r\x1b[K");
  if (r.j.pending) { console.log("\n" + dim("이 질문은 연결된 서비스(MCP) 도구 허락이 필요해요. 사이트나 앱에서 물어봐 주세요.") + "\n"); return ""; }
  if (!r.ok || !r.j.answer) {
    if (r.status === 401) console.log("\n" + red("로그인이 만료됐어요.") + " lago login\n");
    else console.log("\n" + red(r.j.error || "답을 받지 못했어요. 잠시 뒤에 다시 해 주세요.") + "\n");
    return "";
  }
  show(r.j.answer);
  const src = (r.j.sources || []).filter((s) => s.cited !== false && s.url).slice(0, 5);
  if (src.length) console.log(dim(src.map((s) => `[${s.n}] ${s.title} ${s.url}`).join("\n")) + "\n");
  st.hist.push({ r: "u", t: q.slice(0, 300) }, { r: "a", t: r.j.answer.slice(0, 300) });
  st.last = r.j.answer;
  if (st.log) { st.log.push({ q: q.slice(0, 2000), a: r.j.answer.slice(0, 6000), at: Date.now() }); if (st.keep) sessSave(st); }
  return r.j.answer;
}

function safePath(name) {
  const abs = path.resolve(process.cwd(), name);
  if (abs !== process.cwd() && !abs.startsWith(process.cwd() + path.sep)) throw new Error("지금 폴더 밖에는 저장하지 않아요.");
  return abs;
}

async function slash(line, st, rl) {
  const [cmd, ...rest] = line.split(/\s+/);
  const a = rest.join(" ");
  const q = (t) => new Promise((res) => rl.question(t, (x) => res(x.trim())));
  switch (cmd) {
    case "/exit": case "/quit": return "exit";
    case "/help": console.log("\n" + HELP + "\n"); break;
    case "/code": st.code = true; console.log(green("코드 모드") + dim(" · 폴더: " + process.cwd())); break;
    case "/talk": st.code = false; console.log(blue("대화 모드")); break;
    case "/clear": st.hist = []; st.files = []; st.last = ""; console.log(dim("대화 기억을 지웠어요.")); break;
    case "/new": sessSave(st); st.sess = null; st.log = []; st.hist = []; st.files = []; st.last = ""; console.log(green("새 세션을 시작했어요.") + dim(" (이전 세션은 /sessions 에 저장돼 있어요)")); break;
    case "/sessions": case "/session": { sessSave(st); console.log("\n" + bold("세션") + dim("  /resume 번호 로 이어하기\n") + sessLines(sessAll(), st.sess) + "\n"); break; }
    case "/resume": {
      sessSave(st); const list = sessAll();
      if (!list.length) { console.log(dim("저장된 세션이 없어요.")); break; }
      let x = a ? sessPick(list, a) : null;
      if (!a) { console.log("\n" + sessLines(list, st.sess) + "\n"); x = sessPick(list, await q("이어할 번호: ")); }
      if (!x) { console.log(red("그 세션을 찾지 못했어요.")); break; }
      sessOpen(st, x); console.log(green("이어갑니다: ") + (x.title || "") + "\n"); sessRecap(st); break;
    }
    case "/rename":
      if (!a) { console.log(red("쓰는 법: /rename 새 이름")); break; }
      if (!st.sess) st.sess = { id: rid(), created: Date.now(), title: a }; st.sess.title = a.slice(0, 60); sessSave(st); console.log(green("✓ ") + "세션 이름: " + a.slice(0, 60)); break;
    case "/delete": {
      const list = sessAll(); const x = a ? sessPick(list, a) : (st.sess && list.find((y) => y.id === st.sess.id));
      if (!x) { console.log(red("지울 세션을 찾지 못했어요. 쓰는 법: /delete 번호")); break; }
      if (!/^y/i.test(await q(`"${x.title}" 세션을 지울까요? (y/N) `))) { console.log(dim("그대로 둘게요.")); break; }
      try { fs.rmSync(path.join(SDIR, x.id + ".json"), { force: true }); } catch {}
      if (st.sess && st.sess.id === x.id) { st.sess = null; st.log = []; st.hist = []; st.last = ""; }
      console.log(dim("지웠어요.")); break;
    }
    case "/file":
      if (!a || !fs.existsSync(a)) { console.log(red("파일을 찾지 못했어요: ") + a); break; }
      st.files.push(a); console.log(dim("붙였어요: " + a)); break;
    case "/save": {
      const b = blocks(st.last)[Number(rest[0]) - 1];
      if (!b || !rest[1]) { console.log(red("쓰는 법: /save 번호 파일이름")); break; }
      try {
        const abs = safePath(rest.slice(1).join(" "));
        if (fs.existsSync(abs) && !/^y/i.test(await q(`${abs} 가 이미 있어요. 덮어쓸까요? (y/N) `))) { console.log(dim("저장하지 않았어요.")); break; }
        fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, b.code + "\n");
        console.log(green("✓ 저장: ") + abs);
      } catch (e) { console.log(red(e.message)); }
      break;
    }
    case "/run": {
      const b = blocks(st.last)[Number(rest[0]) - 1];
      if (!b) { console.log(red("쓰는 법: /run 번호")); break; }
      console.log(dim("폴더: " + process.cwd()) + "\n" + green(b.code));
      if (!/^y/i.test(await q("이 명령을 실행할까요? (y/N) "))) { console.log(dim("실행하지 않았어요.")); break; }
      await new Promise((res) => { const ch = spawn(b.code, { shell: true, stdio: "inherit", cwd: process.cwd() }); ch.on("close", (code) => { console.log(dim("끝 · 코드 " + code)); res(); }); ch.on("error", (e) => { console.log(red(e.message)); res(); }); });
      break;
    }
    default: console.log(dim("모르는 명령이에요. /help 를 입력해 보세요."));
  }
}


// 시작 화면: 큰 LAGO 글자(파랑 → 초록)와 짧은 상태 안내
const LOGO = [
  "██╗      █████╗  ██████╗  ██████╗ ",
  "██║     ██╔══██╗██╔════╝ ██╔═══██╗",
  "██║     ███████║██║  ███╗██║   ██║",
  "██║     ██╔══██║██║   ██║██║   ██║",
  "███████╗██║  ██║╚██████╔╝╚██████╔╝",
  "╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ",
];
const mix = (a, b, t) => Math.round(a + (b - a) * t);
function logoLine(row) {
  const n = row.length;
  return [...row].map((ch, i) => (ch === " " ? ch : c(`38;2;${mix(37, 22, i / (n - 1))};${mix(99, 163, i / (n - 1))};${mix(235, 74, i / (n - 1))}`, ch))).join("");
}
function banner(cfg, st) {
  const cols = process.stdout.columns || 80;
  if (!TTY || cols < 42) { console.log(bold(blue("LA") + green("GO")) + dim(` CLI ${VERSION} · ${cfg.email || "로그인 안 함 (lago login)"} · /help · /exit`)); return; }
  console.log();
  for (const row of LOGO) console.log("  " + logoLine(row));
  console.log();
  console.log("  " + bold("LAGO CLI") + dim(` v${VERSION}   대화 · 코드 · 위키`));
  console.log("  " + dim("─".repeat(Math.min(46, cols - 4))));
  console.log("  " + dim("계정  ") + (cfg.email ? cfg.email : "로그인 안 함 " + dim("→ lago login")));
  console.log("  " + dim("폴더  ") + process.cwd());
  console.log("  " + dim("세션  ") + (st.sess ? `${st.sess.title || "이어하기"} ${dim(`· ${st.log.length}번 주고받음`)}` : dim("새 세션 · 대화는 자동으로 저장돼요")));
  console.log("  " + dim("모드  ") + (st.code ? green("코드") : blue("대화")) + dim("    /help 도움말   /code 코드 모드   /exit 끝내기"));
  console.log();
}

async function repl(st) {
  st.keep = true;
  const cfg = loadCfg();
  banner(cfg, st);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => rl.setPrompt(st.code ? green("code ❯ ") : blue("lago ❯ "));
  prompt(); rl.prompt();
  let busy = Promise.resolve();
  rl.on("line", (line) => {
    busy = busy.then(async () => {
      line = line.trim();
      if (line) {
        try {
          if (line.startsWith("/")) { if ((await slash(line, st, rl)) === "exit") { rl.close(); return; } }
          else await chat(line, st);
        } catch (e) { console.log(red(e.message)); }
      }
      prompt(); rl.prompt();
    });
  });
  await new Promise((res) => rl.on("close", res));
  await busy.catch(() => {});
}


// lago uninstall: 로그인 정보 · 설치 파일 · PATH 를 한 번에 지워요
async function uninstall(args) {
  const yes = args.includes("-y") || args.includes("--yes");
  const win = process.platform === "win32";
  const exeIsLago = /^lago(\.exe)?$/i.test(path.basename(process.execPath));
  const sc = process.argv[1] && /lago(\.js)?$/i.test(process.argv[1]) && fs.existsSync(process.argv[1]) ? path.resolve(process.argv[1]) : "";
  const self = exeIsLago ? process.execPath : sc;
  const dest = win ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "LAGO", "cli") : "";
  const bin = win ? "" : path.join(os.homedir(), ".local", "bin", "lago");
  // 설치해서 쓰는 사본만 지워요. 압축을 푼 폴더의 원본 파일(install 파일과 같이 있는 것)은 그대로 둬요.
  const installed = !!self && (win ? (self.toLowerCase().startsWith(dest.toLowerCase()) || exeIsLago) : self === bin);
  const list = [fs.existsSync(DIR) && DIR + "  (로그인 정보)", installed && self, win && fs.existsSync(dest) && dest + "  (설치 폴더)", !win && fs.existsSync(bin) && bin].filter(Boolean);
  console.log(bold("LAGO CLI를 지워요") + dim("\n  지울 것: ") + (list.length ? "\n    " + [...new Set(list)].join("\n    ") : "없어요"));
  if (!yes) {
    if (!process.stdin.isTTY) return console.log(red("묻지 않고 지우려면  lago uninstall -y  를 입력하세요."));
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = await new Promise((r) => rl.question("\n정말 지울까요? (y/N) ", r)); rl.close();
    if (!/^y(es)?$/i.test(ans.trim())) return console.log("그대로 둘게요.");
  }
  try { fs.rmSync(DIR, { recursive: true, force: true }); } catch {}
  if (win) {
    try { require("child_process").spawnSync("powershell", ["-NoProfile", "-Command", "$d=$env:LOCALAPPDATA+'\\LAGO\\cli';$p=[Environment]::GetEnvironmentVariable('Path','User');if($p){[Environment]::SetEnvironmentVariable('Path',((($p -split ';')|Where-Object{$_ -and $_ -ne $d}) -join ';'),'User')}"], { stdio: "ignore" }); } catch {}
    try { fs.rmSync(dest, { recursive: true, force: true }); } catch {}
    // 실행 중인 파일은 지금 못 지워서, 이 창이 닫힌 뒤 지워요
    const cmds = [installed && `del /f /q "${self}"`, `if exist "${dest}" rmdir /s /q "${dest}"`].filter(Boolean).join(" & ");
    try { spawn("cmd.exe", ["/c", `ping -n 3 127.0.0.1 >nul & ${cmds}`], { detached: true, stdio: "ignore", windowsHide: true, windowsVerbatimArguments: true }).unref(); } catch {}
  } else {
    try { fs.rmSync(bin, { force: true }); } catch {}
  }
  console.log(green("지웠어요.") + dim(win ? " 이 창을 닫으면 lago 파일도 사라져요. (새 CMD 창부터 lago 명령이 없어져요)" : " 새 터미널부터 lago 명령이 없어져요."));
}

async function readPipe() {
  if (process.stdin.isTTY) return "";
  // 파이프나 파일로 들어온 글만 읽어요. 아무것도 안 들어오면 기다리지 않아요.
  let kind = false;
  try { const st = fs.fstatSync(0); kind = st.isFIFO() || st.isFile(); } catch {}
  if (!kind) return "";
  return await new Promise((res) => {
    let s = "", done = false;
    const end = () => { if (done) return; done = true; clearTimeout(t); process.stdin.pause(); res(s.trim().slice(0, 12000)); };
    const t = setTimeout(() => { if (!s) end(); }, 1500);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (ch) => { s += ch; if (s.length > 20000) end(); });
    process.stdin.on("end", end);
    process.stdin.on("error", end);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const st = { code: false, hist: [], files: [], last: "", piped: "" };
  const a0 = args[0];
  if (a0 === "--help" || a0 === "-h" || a0 === "help") return console.log(HELP);
  if (a0 === "--version" || a0 === "-v") return console.log(VERSION);
  if (a0 === "uninstall" || a0 === "remove") return uninstall(args.slice(1));
  if (a0 === "login") return login(args.slice(1));
  if (a0 === "logout") { const cfg = loadCfg(); saveCfg({ apiKey: cfg.apiKey }); return console.log("로그아웃했어요."); }
  if (a0 === "whoami") { const cfg = loadCfg(); return console.log(cfg.email ? cfg.email : "로그인하지 않았어요. (lago login)"); }
  const sl = () => { const l = sessAll(); return l; };
  if (a0 === "sessions" || a0 === "ls") { console.log("\n" + bold("세션") + dim("  lago -c 로 마지막 것, lago -r 번호 로 골라서 이어하기\n") + sessLines(sl()) + "\n"); return; }
  let resumeKey, wantResume = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-c" || args[i] === "--continue") { wantResume = true; args.splice(i, 1); i--; }
    else if (args[i] === "-r" || args[i] === "--resume") { wantResume = true; args.splice(i, 1); if (args[i] && !/^(code|-)/.test(args[i]) && (/^\d+$/.test(args[i]) || args.length === 1)) { resumeKey = args[i]; args.splice(i, 1); } i--; resumeKey = resumeKey || "?"; }
  }
  st.keep = false; st.log = [];
  if (wantResume) {
    st.keep = true;
    const list = sl();
    if (!list.length) console.log(dim("저장된 세션이 없어서 새로 시작해요."));
    else {
      let x;
      if (resumeKey === "?") { console.log("\n" + sessLines(list) + "\n"); x = sessPick(list, await ask("이어할 번호: ")); }
      else if (resumeKey) x = sessPick(list, resumeKey);
      else x = list.find((y) => y.cwd === process.cwd()) || list[0];
      if (!x) { console.log(red("그 세션을 찾지 못했어요.")); return; }
      sessOpen(st, x); console.log(green("이어갑니다: ") + (x.title || "")); st.resumed = true;
    }
  }
  if (a0 === "code" || args[0] === "code") { st.code = true; if (args[0] === "code") args.shift(); }
  const inter = args[0] === "-i";   // -i: 파이프로 들어온 줄을 대화 입력으로 써요
  if (inter) args.shift();
  const q = args.join(" ").trim();
  if (inter) return repl(st);
  st.piped = await readPipe();
  if (st.resumed && !q && !st.piped) { sessRecap(st); return repl(st); }
  if (q) { await chat(q, st); return; }
  if (st.piped) { await chat(st.code ? "이 내용을 설명해 줘" : "이 글을 요약해 줘", st); return; }
  await repl(st);
}
main().catch((e) => { console.error(red(e.message || String(e))); process.exitCode = 1; });
