// LAGO Desktop — LAGO 웹앱을 창으로 열고, 웹에서는 못 하는 일(작업 폴더 읽기 · 명령 실행 · 파일 저장)을 더해요.
// 안전 장치: LAGO 주소에서 온 요청만 받아요 · 폴더 밖 경로는 막아요 · 실행과 저장은 항상 확인 창에서 허락받아요.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, session } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const https = require("https");
const crypto = require("crypto");
const os = require("os");

const APP_URL = process.env.LAGO_URL || "https://lago-ai-home.lagem1535.workers.dev";
const ORIGIN = new URL(APP_URL).origin;
const AUTH = /^https:\/\/(accounts\.google\.com|[a-z0-9-]+\.firebaseapp\.com|[a-z0-9-]+\.web\.app)\//;
const SKIP = new Set(["node_modules", ".git", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache", ".idea", ".vscode"]);
const CFG = () => path.join(app.getPath("userData"), "lago-desktop.json");
const MAX_READ = 400 * 1024, MAX_WRITE = 2 * 1024 * 1024, MAX_OUT = 200 * 1024, RUN_MS = 5 * 60 * 1000;

const MAC = process.platform === "darwin", WIN = process.platform === "win32";
const BAR_H = 36;
// 창 위쪽 띠: 기본 제목 표시줄 대신 앱과 같은 색의 얇은 띠를 그려요 (끌어서 창 이동).
const BAR_CSS = `
#app{position:fixed!important;top:${BAR_H}px;left:0;right:0;bottom:0;height:auto!important;overflow:auto;transform:translateZ(0)}
.shell{height:100%!important;min-height:0!important}
.auth,.pubpage,.splash{min-height:100%!important}
.acct{max-height:calc(100dvh - 132px)!important}.flyout{max-height:calc(100dvh - 156px)!important}
body::before{content:"";position:fixed;top:0;left:0;right:0;height:${BAR_H}px;box-sizing:border-box;background:#fff;border-bottom:1px solid #E6EBF5;-webkit-app-region:drag;user-select:none;z-index:2147483000}
html[data-lago=dark] body::before{background:#212121;border-bottom-color:#2E2E2E}
`;
const SYMBOL = { light: "#0B2A6F", dark: "#E5E7EB" };

let win = null;
let root = null;

const cfg = () => { try { return JSON.parse(fs.readFileSync(CFG(), "utf8")); } catch { return {}; } };
const setCfg = (o) => { try { fs.writeFileSync(CFG(), JSON.stringify({ ...cfg(), ...o })); } catch {} };
const isApp = (u) => { try { return new URL(u).origin === ORIGIN; } catch { return false; } };

function guard(e) {
  const u = e.senderFrame && e.senderFrame.url;
  if (!isApp(u)) throw new Error("허용되지 않은 페이지예요");
}
function inside(rel) {
  if (!root) throw new Error("먼저 작업 폴더를 열어 주세요");
  const abs = path.resolve(root, String(rel || "."));
  if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error("작업 폴더 밖은 열 수 없어요");
  if (fs.existsSync(abs)) {
    const real = fs.realpathSync(abs), rr = fs.realpathSync(root);
    if (real !== rr && !real.startsWith(rr + path.sep)) throw new Error("작업 폴더 밖을 가리키는 링크예요");
  }
  return abs;
}
function walk(dir, pre, out, depth) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const d of ents) {
    if (out.length >= 800) return;
    if (SKIP.has(d.name)) continue;
    const p = pre ? pre + "/" + d.name : d.name;
    if (d.isDirectory()) { out.push({ p, dir: true }); if (depth < 6) walk(path.join(dir, d.name), p, out, depth + 1); }
    else if (d.isFile()) { let size = 0; try { size = fs.statSync(path.join(dir, d.name)).size; } catch {} out.push({ p, dir: false, size }); }
  }
}
const info = () => (root ? { name: path.basename(root), path: root } : null);

async function ask(message, detail, ok) {
  const r = await dialog.showMessageBox(win, { type: "warning", buttons: [ok, "취소"], defaultId: 1, cancelId: 1, noLink: true, title: "LAGO", message, detail });
  return r.response === 0;
}

ipcMain.handle("lago:pick", async (e) => {
  guard(e);
  const r = await dialog.showOpenDialog(win, { title: "작업 폴더 고르기", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return null;
  root = fs.realpathSync(r.filePaths[0]);
  setCfg({ root });
  return info();
});
ipcMain.handle("lago:current", (e) => { guard(e); return info(); });
ipcMain.handle("lago:list", (e) => { guard(e); if (!root) return []; const out = []; walk(root, "", out, 0); return out; });
ipcMain.handle("lago:read", (e, rel) => {
  guard(e);
  try {
    const abs = inside(rel); const st = fs.statSync(abs);
    if (!st.isFile()) return { error: "파일이 아니에요" };
    if (st.size > MAX_READ) return { error: "파일이 너무 커요 (400KB까지 읽어요)" };
    return fs.readFileSync(abs, "utf8");
  } catch (er) { return { error: er.message }; }
});
ipcMain.handle("lago:write", async (e, rel, text) => {
  guard(e);
  try {
    text = String(text || "");
    if (Buffer.byteLength(text) > MAX_WRITE) return { error: "저장할 내용이 너무 커요 (2MB까지)" };
    const abs = inside(rel); const exists = fs.existsSync(abs);
    const ok = await ask(exists ? "이미 있는 파일을 덮어쓸까요?" : "이 파일을 만들까요?", `${abs}\n\n${text.length.toLocaleString()}자`, exists ? "덮어쓰기" : "저장");
    if (!ok) return { denied: true };
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text, "utf8");
    return { ok: true };
  } catch (er) { return { error: er.message }; }
});
ipcMain.handle("lago:run", async (e, cmd, cwdRel) => {
  guard(e);
  try {
    cmd = String(cmd || "").trim();
    if (!cmd || cmd.length > 4000) return { error: "명령이 비었거나 너무 길어요" };
    const cwd = inside(cwdRel);
    if (!fs.statSync(cwd).isDirectory()) return { error: "폴더가 아니에요" };
    const ok = await ask("이 명령을 실행할까요?", `폴더: ${cwd}\n\n${cmd}\n\n실행한 결과는 되돌릴 수 없을 수도 있어요. 내용을 꼭 확인해 주세요.`, "실행");
    if (!ok) return { denied: true };
    return await new Promise((res) => {
      const full = WIN ? "chcp 65001>nul & " + cmd : cmd;
      const ch = spawn(full, { cwd, shell: true, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
      let out = "", err = "", timeout = false;
      const add = (s, d) => (s.length < MAX_OUT ? s + d.toString("utf8") : s);
      ch.stdout.on("data", (d) => { out = add(out, d); });
      ch.stderr.on("data", (d) => { err = add(err, d); });
      const t = setTimeout(() => { timeout = true; try { ch.kill(); } catch {} }, RUN_MS);
      ch.on("error", (er) => { clearTimeout(t); res({ code: -1, out, err: err + er.message, timeout }); });
      ch.on("close", (code) => { clearTimeout(t); res({ code, out: out.slice(0, MAX_OUT), err: err.slice(0, MAX_OUT), timeout }); });
    });
  } catch (er) { return { error: er.message }; }
});

function createWindow() {
  const c = cfg();
  if (c.root && fs.existsSync(c.root)) root = c.root;
  win = new BrowserWindow({
    width: c.w || 1280, height: c.h || 840, minWidth: 380, minHeight: 520,
    title: "LAGO", backgroundColor: "#ffffff", autoHideMenuBar: true,
    titleBarStyle: MAC ? "hiddenInset" : "hidden",
    ...(MAC ? { trafficLightPosition: { x: 13, y: 11 } } : { titleBarOverlay: { color: "rgba(0,0,0,0)", symbolColor: SYMBOL.light, height: BAR_H } }),
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, sandbox: true, nodeIntegration: false,
      additionalArguments: ["--lago-origin=" + ORIGIN, "--lago-version=" + app.getVersion()],
    },
  });
  // Google 로그인이 "안전하지 않은 브라우저"로 막히지 않게 Electron 표시를 빼요
  win.webContents.setUserAgent(win.webContents.getUserAgent().replace(/ (Electron|lago-desktop)\/\S+/g, ""));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isApp(url) || AUTH.test(url)) return { action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true, webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false } } };
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (ev, url) => {
    if (isApp(url) || AUTH.test(url)) return;
    ev.preventDefault();
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
  });
  win.webContents.on("did-fail-load", (ev, code, desc, url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, "offline.html"), { query: { u: APP_URL } });
  });
  win.webContents.on("dom-ready", () => { if (isApp(win.webContents.getURL())) win.webContents.insertCSS(BAR_CSS).catch(() => {}); });
  win.on("close", () => { const b = win.getBounds(); setCfg({ w: b.width, h: b.height }); });
  win.loadURL(APP_URL);
}

ipcMain.on("lago:theme", (e, dark) => {
  if (!win || MAC || !isApp(e.senderFrame && e.senderFrame.url)) return;
  try { win.setTitleBarOverlay({ color: "rgba(0,0,0,0)", symbolColor: dark ? SYMBOL.dark : SYMBOL.light, height: BAR_H }); } catch {}
});

// 앱 지우기를 쉽게: 설치 종류에 맞는 화면을 바로 열어 줘요
async function uninstallHelp() {
  const portable = process.env.PORTABLE_EXECUTABLE_FILE;
  if (MAC) {
    const r = await dialog.showMessageBox(win, { type: "question", buttons: ["Applications 폴더 보기", "취소"], defaultId: 0, cancelId: 1, title: "LAGO 지우기", message: "LAGO를 지울까요?", detail: "열리는 폴더에서 LAGO를 휴지통으로 끌어다 놓으면 돼요." });
    if (r.response === 0) shell.showItemInFolder(app.getPath("exe"));
  } else if (portable) {
    const r = await dialog.showMessageBox(win, { type: "question", buttons: ["파일 위치 열기", "취소"], defaultId: 0, cancelId: 1, title: "LAGO 지우기", message: "포터블 버전은 설치되지 않아요", detail: "열리는 폴더에서 LAGO-Portable.exe 파일을 지우면 끝이에요. (저장된 설정은 앱 데이터 폴더에 조금 남아 있어요)" });
    if (r.response === 0) shell.showItemInFolder(portable);
  } else {
    const r = await dialog.showMessageBox(win, { type: "question", buttons: ["설치된 앱 열기", "취소"], defaultId: 0, cancelId: 1, title: "LAGO 지우기", message: "LAGO를 지울까요?", detail: "Windows ‘설치된 앱’ 화면이 열려요. 목록에서 LAGO를 찾아 ⋯ → 제거를 누르세요." });
    if (r.response === 0) shell.openExternal("ms-settings:appsfeatures");
  }
}


/* ---------- 업데이트: 새 버전을 내려받아 설치 마법사를 열어 줘요 ---------- */
const REPO = "lagem1535-create/LAGO_AI_home";
const HOSTS = /^(api\.github\.com|github\.com|objects\.githubusercontent\.com|release-assets\.githubusercontent\.com)$/;
const UPD = { info: null, file: null, busy: false };
function getBuf(url, opt = {}, hop = 0) {
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(url); } catch { return reject(new Error("주소가 올바르지 않아요")); }
    if (u.protocol !== "https:" || !HOSTS.test(u.hostname)) return reject(new Error("허용되지 않은 주소예요"));
    const req = https.get(u, { headers: { "user-agent": "lago-desktop", accept: "application/octet-stream, application/vnd.github+json" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && hop < 5) { res.resume(); return resolve(getBuf(new URL(res.headers.location, u).href, opt, hop + 1)); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("서버 응답 " + res.statusCode)); }
      if (opt.file) {
        const total = Number(res.headers["content-length"] || 0); let done = 0, last = 0;
        const out = fs.createWriteStream(opt.file); const h = crypto.createHash("sha256");
        res.on("data", (d) => { done += d.length; h.update(d); const now = Date.now(); if (opt.onProgress && now - last > 120) { last = now; opt.onProgress(done, total); } });
        res.pipe(out);
        out.on("finish", () => { opt.onProgress && opt.onProgress(done, total || done); resolve({ sha256: h.digest("hex"), size: done }); });
        out.on("error", reject); res.on("error", reject);
      } else { const a = []; res.on("data", (d) => a.push(d)); res.on("end", () => resolve(Buffer.concat(a))); res.on("error", reject); }
    });
    req.setTimeout(30000, () => req.destroy(new Error("연결이 너무 오래 걸려요")));
    req.on("error", reject);
  });
}
const vnum = (v) => String(v || "").split(".").map((x) => parseInt(x, 10) || 0);
const vnewer = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
function pickAsset(assets) {
  const portable = !!process.env.PORTABLE_EXECUTABLE_FILE;
  const want = MAC ? "LAGO-Mac-" + (process.arch === "arm64" ? "arm64" : "x64") + ".dmg" : WIN ? (portable ? "LAGO-Portable.exe" : "LAGO-Setup.exe") : "";
  return assets.find((a) => a.name === want) || null;
}
async function updCheck() {
  const j = JSON.parse((await getBuf(`https://api.github.com/repos/${REPO}/releases/latest`)).toString("utf8"));
  const m = /^app-v(\d+\.\d+\.\d+)/.exec(String(j.tag_name || ""));
  const cur = app.getVersion();
  const asset = pickAsset(j.assets || []);
  const sums = (j.assets || []).find((a) => a.name === "SHA256SUMS.txt");
  const info = { current: cur, latest: m ? m[1] : cur, newer: !!(m && vnewer(m[1], cur) && asset), notes: String(j.body || "").slice(0, 900), name: asset ? asset.name : "", size: asset ? asset.size : 0, mode: MAC ? "mac" : process.env.PORTABLE_EXECUTABLE_FILE ? "portable" : WIN ? "setup" : "none", url: asset ? asset.browser_download_url : "", sums: sums ? sums.browser_download_url : "" };
  UPD.info = info; return info;
}
function say(ch, data) { try { if (win && !win.isDestroyed()) win.webContents.send(ch, data); } catch {} }
async function updDownload() {
  const info = UPD.info || (await updCheck());
  if (!info.newer || !info.url) throw new Error("받을 새 버전이 없어요");
  if (UPD.busy) throw new Error("이미 내려받는 중이에요");
  UPD.busy = true;
  try {
    const dir = path.join(app.getPath("temp"), "lago-update"); fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, info.name); try { fs.rmSync(dest, { force: true }); } catch {}
    const r = await getBuf(info.url, { file: dest, onProgress: (d, t) => say("lago:upd-progress", { done: d, total: t, pct: t ? Math.min(99, Math.round((d / t) * 100)) : 0 }) });
    if (info.sums) {
      const txt = (await getBuf(info.sums)).toString("utf8");
      const line = txt.split(/\r?\n/).map((l) => l.trim().split(/\s+\*?/)).find((x) => x[1] === info.name);
      if (!line) throw new Error("새 파일의 확인 값을 찾지 못해서 멈췄어요");
      if (line[0].toLowerCase() !== r.sha256) { try { fs.rmSync(dest, { force: true }); } catch {} throw new Error("내려받은 파일이 올바르지 않아요 (확인 값 불일치). 다시 시도해 주세요"); }
    }
    UPD.file = dest; say("lago:upd-progress", { done: r.size, total: r.size, pct: 100 });
    return { ok: true, name: info.name, mode: info.mode, verified: !!info.sums };
  } finally { UPD.busy = false; }
}
function updInstall() {
  if (!UPD.file || !fs.existsSync(UPD.file)) throw new Error("먼저 내려받아 주세요");
  const f = UPD.file;
  if (WIN && !process.env.PORTABLE_EXECUTABLE_FILE) {
    // 설치 마법사(NSIS)를 열고 이 앱은 닫아요. 마법사가 끝나면 새 LAGO가 켜져요.
    const c = spawn(f, [], { detached: true, stdio: "ignore" }); c.unref();
    setTimeout(() => app.quit(), 700);
    return { ok: true, how: "wizard" };
  }
  if (MAC) { shell.openPath(f); return { ok: true, how: "dmg" }; }
  const dl = path.join(app.getPath("downloads"), path.basename(f));
  try { fs.copyFileSync(f, dl); shell.showItemInFolder(dl); } catch { shell.showItemInFolder(f); }
  return { ok: true, how: "portable" };
}
ipcMain.handle("lago:upd-check", async (e) => { guard(e); try { return await updCheck(); } catch (er) { return { error: er.message }; } });
ipcMain.handle("lago:upd-download", async (e) => { guard(e); try { return await updDownload(); } catch (er) { return { error: er.message }; } });
ipcMain.handle("lago:upd-install", (e) => { guard(e); try { return updInstall(); } catch (er) { return { error: er.message }; } });
async function checkOnStart() {
  try { const i = await updCheck(); if (i.newer) say("lago:upd-avail", i); } catch {}
}

ipcMain.on("lago:retry", (e) => { if (win) win.loadURL(APP_URL); });

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: "LAGO", submenu: [{ label: "새로 고침", accelerator: "F5", click: () => win && win.reload() }, { label: "처음 화면", click: () => win && win.loadURL(APP_URL) }, { label: "업데이트 확인…", click: () => { say("lago:upd-open", {}); } }, { label: "LAGO 지우기…", click: () => uninstallHelp() }, { type: "separator" }, { role: "quit", label: "끝내기" }] },
      { label: "편집", submenu: [{ role: "undo", label: "되돌리기" }, { role: "redo", label: "다시 하기" }, { type: "separator" }, { role: "cut", label: "잘라내기" }, { role: "copy", label: "복사" }, { role: "paste", label: "붙여넣기" }, { role: "selectAll", label: "모두 선택" }] },
      { label: "보기", submenu: [{ role: "zoomIn", label: "크게" }, { role: "zoomOut", label: "작게" }, { role: "resetZoom", label: "원래 크기" }, { type: "separator" }, { role: "togglefullscreen", label: "전체 화면" }, { role: "toggleDevTools", label: "개발자 도구" }] },
    ]));
    // 예전 화면이 남아 새 기능이 늦게 보이는 일이 없게 시작할 때 저장된 화면 파일을 비워요
    session.defaultSession.clearCache().catch(() => {}).finally(() => {
      createWindow();
      win.webContents.once("did-finish-load", () => setTimeout(checkOnStart, 4000));
    });
  });
  app.on("window-all-closed", () => app.quit());
}
