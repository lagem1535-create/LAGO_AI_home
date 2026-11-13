// LAGO Desktop (Rust · Tauri) — LAGO 웹앱을 창으로 열고, 웹에서는 못 하는 일(작업 폴더 읽기 · 명령 실행 · 파일 저장)을 더해요.
// 안전 장치: LAGO 주소에서 온 요청만 받아요 · 폴더 밖 경로는 막아요 · 실행과 저장은 항상 확인 창에서 허락받아요.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager, State, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

const APP_URL: &str = "https://lago-ai-home.lagem1535.workers.dev";
const REPO: &str = "lagem1535-create/LAGO_AI_home";
const SKIP: [&str; 11] = ["node_modules", ".git", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".cache", ".idea", ".vscode"];
const MAX_READ: u64 = 400 * 1024;
const MAX_WRITE: usize = 2 * 1024 * 1024;
const MAX_OUT: usize = 200 * 1024;
const RUN_MS: u64 = 5 * 60 * 1000;

#[derive(Default)]
struct Upd {
    info: Option<Value>,
    file: Option<PathBuf>,
    busy: bool,
}
#[derive(Default)]
struct St {
    root: Mutex<Option<PathBuf>>,
    upd: Mutex<Upd>,
}

/* ---------- 작은 도우미 ---------- */
fn app_origin() -> String {
    Url::parse(APP_URL).map(|u| u.origin().ascii_serialization()).unwrap_or_default()
}
fn is_app(u: &Url) -> bool {
    u.origin().ascii_serialization() == app_origin()
}
fn is_auth(u: &Url) -> bool {
    if u.scheme() != "https" {
        return false;
    }
    let h = u.host_str().unwrap_or("");
    h == "accounts.google.com" || h.ends_with(".firebaseapp.com") || h.ends_with(".web.app")
}
fn guard(w: &WebviewWindow) -> Result<(), String> {
    match w.url() {
        Ok(u) if is_app(&u) => Ok(()),
        _ => Err("허용되지 않은 페이지예요".into()),
    }
}
fn err(m: impl Into<String>) -> Value {
    json!({ "error": m.into() })
}
fn cfg_path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("lago-desktop.json"))
}
fn cfg(app: &AppHandle) -> Value {
    cfg_path(app)
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str::<Value>(&s).ok())
        .filter(|v| v.is_object())
        .unwrap_or_else(|| json!({}))
}
fn set_cfg(app: &AppHandle, patch: Value) {
    let mut c = cfg(app);
    if let (Some(o), Some(p)) = (c.as_object_mut(), patch.as_object()) {
        for (k, v) in p {
            o.insert(k.clone(), v.clone());
        }
    }
    if let Some(p) = cfg_path(app) {
        if let Some(d) = p.parent() {
            let _ = fs::create_dir_all(d);
        }
        let _ = fs::write(p, c.to_string());
    }
}
fn root_of(st: &St) -> Option<PathBuf> {
    st.root.lock().ok().and_then(|g| g.clone())
}
fn info(st: &St) -> Value {
    match root_of(st) {
        Some(r) => json!({ "name": r.file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_default(), "path": r.to_string_lossy() }),
        None => Value::Null,
    }
}
/// 작업 폴더 안의 경로만 돌려줘요. `..` 이나 바깥을 가리키는 링크는 막아요.
fn inside(st: &St, rel: &str) -> Result<PathBuf, String> {
    let root = root_of(st).ok_or("먼저 작업 폴더를 열어 주세요")?;
    let mut abs = root.clone();
    let rel = if rel.is_empty() { "." } else { rel };
    for c in Path::new(rel).components() {
        match c {
            Component::Normal(s) => abs.push(s),
            Component::CurDir => {}
            Component::ParentDir => {
                if abs == root || !abs.pop() {
                    return Err("작업 폴더 밖은 열 수 없어요".into());
                }
            }
            Component::RootDir | Component::Prefix(_) => return Err("작업 폴더 밖은 열 수 없어요".into()),
        }
    }
    if !abs.starts_with(&root) {
        return Err("작업 폴더 밖은 열 수 없어요".into());
    }
    if abs.exists() {
        let real = dunce::canonicalize(&abs).map_err(|e| e.to_string())?;
        let rr = dunce::canonicalize(&root).map_err(|e| e.to_string())?;
        if !real.starts_with(&rr) {
            return Err("작업 폴더 밖을 가리키는 링크예요".into());
        }
    }
    Ok(abs)
}
fn walk(dir: &Path, pre: &str, out: &mut Vec<Value>, depth: u32) {
    let Ok(rd) = fs::read_dir(dir) else { return };
    let mut ents: Vec<_> = rd.flatten().collect();
    ents.sort_by_key(|e| e.file_name());
    for d in ents {
        if out.len() >= 800 {
            return;
        }
        let name = d.file_name().to_string_lossy().to_string();
        if SKIP.contains(&name.as_str()) {
            continue;
        }
        let p = if pre.is_empty() { name.clone() } else { format!("{pre}/{name}") };
        let Ok(ft) = d.file_type() else { continue };
        if ft.is_dir() {
            out.push(json!({ "p": p, "dir": true }));
            if depth < 6 {
                walk(&d.path(), &p, out, depth + 1);
            }
        } else if ft.is_file() {
            let size = d.metadata().map(|m| m.len()).unwrap_or(0);
            out.push(json!({ "p": p, "dir": false, "size": size }));
        }
    }
}
fn ask(app: &AppHandle, message: &str, detail: &str, ok: &str) -> bool {
    app.dialog()
        .message(format!("{message}\n\n{detail}"))
        .title("LAGO")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(ok.to_string(), "취소".to_string()))
        .blocking_show()
}
fn say(app: &AppHandle, kind: &str, data: &Value) {
    if let Some(w) = app.get_webview_window("main") {
        if w.url().map(|u| is_app(&u)).unwrap_or(false) {
            let js = format!("window.__lagoUpd&&window.__lagoUpd({},{})", json!(kind), data);
            let _ = w.eval(js.as_str());
        }
    }
}

/* ---------- 작업 폴더 · 파일 · 실행 ---------- */
#[tauri::command]
async fn pick(app: AppHandle, w: WebviewWindow, st: State<'_, St>) -> Result<Value, String> {
    guard(&w)?;
    let Some(fp) = app.dialog().file().set_title("작업 폴더 고르기").blocking_pick_folder() else {
        return Ok(Value::Null);
    };
    let p = fp.into_path().map_err(|e| e.to_string())?;
    let real = dunce::canonicalize(&p).map_err(|e| e.to_string())?;
    set_cfg(&app, json!({ "root": real.to_string_lossy() }));
    if let Ok(mut g) = st.root.lock() {
        *g = Some(real);
    }
    Ok(info(&st))
}
#[tauri::command]
fn current(w: WebviewWindow, st: State<'_, St>) -> Result<Value, String> {
    guard(&w)?;
    Ok(info(&st))
}
#[tauri::command]
async fn list(w: WebviewWindow, st: State<'_, St>) -> Result<Value, String> {
    guard(&w)?;
    let mut out = Vec::new();
    if let Some(r) = root_of(&st) {
        walk(&r, "", &mut out, 0);
    }
    Ok(Value::Array(out))
}
#[tauri::command]
async fn read(w: WebviewWindow, st: State<'_, St>, rel: String) -> Result<Value, String> {
    guard(&w)?;
    let abs = match inside(&st, &rel) {
        Ok(a) => a,
        Err(e) => return Ok(err(e)),
    };
    let md = match fs::metadata(&abs) {
        Ok(m) => m,
        Err(e) => return Ok(err(e.to_string())),
    };
    if !md.is_file() {
        return Ok(err("파일이 아니에요"));
    }
    if md.len() > MAX_READ {
        return Ok(err("파일이 너무 커요 (400KB까지 읽어요)"));
    }
    match fs::read(&abs) {
        Ok(b) => Ok(Value::String(String::from_utf8_lossy(&b).to_string())),
        Err(e) => Ok(err(e.to_string())),
    }
}
#[tauri::command]
async fn write(app: AppHandle, w: WebviewWindow, st: State<'_, St>, rel: String, text: String) -> Result<Value, String> {
    guard(&w)?;
    if text.len() > MAX_WRITE {
        return Ok(err("저장할 내용이 너무 커요 (2MB까지)"));
    }
    let abs = match inside(&st, &rel) {
        Ok(a) => a,
        Err(e) => return Ok(err(e)),
    };
    let exists = abs.exists();
    let ok = ask(
        &app,
        if exists { "이미 있는 파일을 덮어쓸까요?" } else { "이 파일을 만들까요?" },
        &format!("{}\n\n{}자", abs.to_string_lossy(), text.chars().count()),
        if exists { "덮어쓰기" } else { "저장" },
    );
    if !ok {
        return Ok(json!({ "denied": true }));
    }
    if let Some(d) = abs.parent() {
        if let Err(e) = fs::create_dir_all(d) {
            return Ok(err(e.to_string()));
        }
    }
    match fs::write(&abs, text.as_bytes()) {
        Ok(_) => Ok(json!({ "ok": true })),
        Err(e) => Ok(err(e.to_string())),
    }
}
fn shell_cmd(cmd: &str) -> Command {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let mut c = Command::new("cmd");
        // 한글이 깨지지 않게 UTF-8로 바꾼 뒤 실행해요. 검은 창은 띄우지 않아요.
        c.raw_arg("/D /S /C \"chcp 65001>nul & ").raw_arg(cmd).raw_arg("\"");
        c.creation_flags(0x0800_0000);
        c
    }
    #[cfg(not(windows))]
    {
        let mut c = Command::new("sh");
        c.arg("-c").arg(cmd);
        c
    }
}
fn kill_tree(pid: u32, child: &mut std::process::Child) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = Command::new("taskkill").args(["/T", "/F", "/PID", &pid.to_string()]).creation_flags(0x0800_0000).status();
    }
    let _ = pid;
    let _ = child.kill();
}
fn pump<R: Read + Send + 'static>(mut r: R) -> std::thread::JoinHandle<Vec<u8>> {
    std::thread::spawn(move || {
        let mut out = Vec::new();
        let mut buf = [0u8; 8192];
        while let Ok(n) = r.read(&mut buf) {
            if n == 0 {
                break;
            }
            if out.len() < MAX_OUT {
                let take = n.min(MAX_OUT - out.len());
                out.extend_from_slice(&buf[..take]);
            }
        }
        out
    })
}
#[tauri::command]
async fn run(app: AppHandle, w: WebviewWindow, st: State<'_, St>, cmd: String, cwd: String) -> Result<Value, String> {
    guard(&w)?;
    let cmd = cmd.trim().to_string();
    if cmd.is_empty() || cmd.chars().count() > 4000 {
        return Ok(err("명령이 비었거나 너무 길어요"));
    }
    let dir = match inside(&st, &cwd) {
        Ok(a) => a,
        Err(e) => return Ok(err(e)),
    };
    if !dir.is_dir() {
        return Ok(err("폴더가 아니에요"));
    }
    let ok = ask(
        &app,
        "이 명령을 실행할까요?",
        &format!("폴더: {}\n\n{}\n\n실행한 결과는 되돌릴 수 없을 수도 있어요. 내용을 꼭 확인해 주세요.", dir.to_string_lossy(), cmd),
        "실행",
    );
    if !ok {
        return Ok(json!({ "denied": true }));
    }
    let mut c = shell_cmd(&cmd);
    c.current_dir(&dir).env("PYTHONIOENCODING", "utf-8").stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = match c.spawn() {
        Ok(ch) => ch,
        Err(e) => return Ok(json!({ "code": -1, "out": "", "err": e.to_string(), "timeout": false })),
    };
    let pid = child.id();
    let so = child.stdout.take().map(pump);
    let se = child.stderr.take().map(pump);
    let t0 = Instant::now();
    let mut timeout = false;
    let code = loop {
        match child.try_wait() {
            Ok(Some(s)) => break s.code().unwrap_or(-1),
            Ok(None) => {
                if t0.elapsed() > Duration::from_millis(RUN_MS) {
                    timeout = true;
                    kill_tree(pid, &mut child);
                    let _ = child.wait();
                    break -1;
                }
                std::thread::sleep(Duration::from_millis(40));
            }
            Err(_) => break -1,
        }
    };
    let out = so.and_then(|h| h.join().ok()).unwrap_or_default();
    let er = se.and_then(|h| h.join().ok()).unwrap_or_default();
    Ok(json!({ "code": code, "out": String::from_utf8_lossy(&out), "err": String::from_utf8_lossy(&er), "timeout": timeout }))
}

/* ---------- 업데이트: 새 버전을 내려받아 설치 마법사를 열어 줘요 ---------- */
fn host_ok(url: &str) -> bool {
    Url::parse(url)
        .map(|u| {
            u.scheme() == "https"
                && matches!(u.host_str().unwrap_or(""), "api.github.com" | "github.com" | "objects.githubusercontent.com" | "release-assets.githubusercontent.com")
        })
        .unwrap_or(false)
}
fn http_get(url: &str) -> Result<ureq::Response, String> {
    if !host_ok(url) {
        return Err("허용되지 않은 주소예요".into());
    }
    let tls = native_tls::TlsConnector::new().map_err(|e| e.to_string())?;
    let agent = ureq::AgentBuilder::new().tls_connector(Arc::new(tls)).timeout_connect(Duration::from_secs(30)).timeout_read(Duration::from_secs(60)).redirects(5).build();
    agent
        .get(url)
        .set("user-agent", "lago-desktop")
        .set("accept", "application/octet-stream, application/vnd.github+json")
        .call()
        .map_err(|e| match e {
            ureq::Error::Status(c, _) => format!("서버 응답 {c}"),
            other => format!("연결하지 못했어요 ({other})"),
        })
}
fn vnum(v: &str) -> Vec<u64> {
    v.split('.').map(|x| x.trim().parse::<u64>().unwrap_or(0)).collect()
}
fn vnewer(a: &str, b: &str) -> bool {
    let (x, y) = (vnum(a), vnum(b));
    for i in 0..3 {
        let (p, q) = (x.get(i).copied().unwrap_or(0), y.get(i).copied().unwrap_or(0));
        if p != q {
            return p > q;
        }
    }
    false
}
fn portable() -> bool {
    std::env::current_exe().ok().and_then(|p| p.file_name().map(|s| s.to_string_lossy().to_lowercase())).map(|n| n.contains("portable")).unwrap_or(false)
}
fn upd_mode() -> &'static str {
    if cfg!(target_os = "macos") {
        "mac"
    } else if cfg!(windows) {
        if portable() {
            "portable"
        } else {
            "setup"
        }
    } else {
        "none"
    }
}
fn want_asset() -> String {
    match upd_mode() {
        "mac" => format!("LAGO-Mac-{}.dmg", if cfg!(target_arch = "aarch64") { "arm64" } else { "x64" }),
        "portable" => "LAGO-Portable.exe".into(),
        "setup" => "LAGO-Setup.exe".into(),
        _ => String::new(),
    }
}
fn do_check(app: &AppHandle, st: &St) -> Result<Value, String> {
    let body = http_get(&format!("https://api.github.com/repos/{REPO}/releases/latest"))?.into_string().map_err(|e| e.to_string())?;
    let j: Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    let cur = app.package_info().version.to_string();
    let tag = j["tag_name"].as_str().unwrap_or("");
    let latest: Option<String> = tag.strip_prefix("app-v").map(|s| s.chars().take_while(|c| c.is_ascii_digit() || *c == '.').collect::<String>()).filter(|s| s.split('.').count() == 3);
    let empty = Vec::new();
    let assets = j["assets"].as_array().unwrap_or(&empty);
    let want = want_asset();
    let asset = assets.iter().find(|a| !want.is_empty() && a["name"].as_str() == Some(want.as_str()));
    let sums = assets.iter().find(|a| a["name"].as_str() == Some("SHA256SUMS.txt"));
    let newer = match (&latest, asset) {
        (Some(l), Some(_)) => vnewer(l, &cur),
        _ => false,
    };
    let info = json!({
        "current": cur,
        "latest": latest.clone().unwrap_or_else(|| cur.clone()),
        "newer": newer,
        "notes": j["body"].as_str().unwrap_or("").chars().take(900).collect::<String>(),
        "name": asset.and_then(|a| a["name"].as_str()).unwrap_or(""),
        "size": asset.and_then(|a| a["size"].as_u64()).unwrap_or(0),
        "mode": upd_mode(),
        "url": asset.and_then(|a| a["browser_download_url"].as_str()).unwrap_or(""),
        "sums": sums.and_then(|a| a["browser_download_url"].as_str()).unwrap_or(""),
    });
    if let Ok(mut u) = st.upd.lock() {
        u.info = Some(info.clone());
    }
    Ok(info)
}
fn do_download(app: &AppHandle, st: &St) -> Result<Value, String> {
    let cached = st.upd.lock().ok().and_then(|u| u.info.clone());
    let info = match cached {
        Some(i) => i,
        None => do_check(app, st)?,
    };
    let url = info["url"].as_str().unwrap_or("").to_string();
    let name = info["name"].as_str().unwrap_or("").to_string();
    if info["newer"].as_bool() != Some(true) || url.is_empty() || name.is_empty() || name.contains(['/', '\\']) {
        return Err("받을 새 버전이 없어요".into());
    }
    let dir = std::env::temp_dir().join("lago-update");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dest = dir.join(&name);
    let _ = fs::remove_file(&dest);
    let resp = http_get(&url)?;
    let total: u64 = resp.header("content-length").and_then(|s| s.parse().ok()).unwrap_or(0);
    let mut rd = resp.into_reader();
    let mut f = fs::File::create(&dest).map_err(|e| e.to_string())?;
    let mut h = Sha256::new();
    let mut buf = vec![0u8; 64 * 1024];
    let (mut done, mut last) = (0u64, Instant::now());
    loop {
        let n = rd.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        f.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        h.update(&buf[..n]);
        done += n as u64;
        if last.elapsed() > Duration::from_millis(120) {
            last = Instant::now();
            let pct = if total > 0 { ((done as f64 / total as f64) * 100.0).round().min(99.0) as u64 } else { 0 };
            say(app, "progress", &json!({ "done": done, "total": total, "pct": pct }));
        }
    }
    f.flush().map_err(|e| e.to_string())?;
    drop(f);
    let sha: String = h.finalize().iter().map(|b| format!("{b:02x}")).collect();
    let sums = info["sums"].as_str().unwrap_or("");
    if !sums.is_empty() {
        let txt = http_get(sums)?.into_string().map_err(|e| e.to_string())?;
        let line = txt.lines().find_map(|l| {
            let mut it = l.split_whitespace();
            let (hx, nm) = (it.next()?, it.next()?);
            (nm.trim_start_matches('*') == name).then(|| hx.to_lowercase())
        });
        match line {
            None => return Err("새 파일의 확인 값을 찾지 못해서 멈췄어요".into()),
            Some(hx) if hx != sha => {
                let _ = fs::remove_file(&dest);
                return Err("내려받은 파일이 올바르지 않아요 (확인 값 불일치). 다시 시도해 주세요".into());
            }
            _ => {}
        }
    }
    if let Ok(mut u) = st.upd.lock() {
        u.file = Some(dest);
    }
    say(app, "progress", &json!({ "done": done, "total": done, "pct": 100 }));
    Ok(json!({ "ok": true, "name": name, "mode": info["mode"], "verified": !sums.is_empty() }))
}
fn reveal(p: &Path) {
    #[cfg(windows)]
    {
        let _ = Command::new("explorer").arg(format!("/select,{}", p.to_string_lossy())).spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg("-R").arg(p).spawn();
    }
    #[cfg(not(any(windows, target_os = "macos")))]
    {
        if let Some(d) = p.parent() {
            let _ = open::that(d);
        }
    }
}
#[tauri::command]
async fn upd_check(app: AppHandle, w: WebviewWindow, st: State<'_, St>) -> Result<Value, String> {
    guard(&w)?;
    Ok(do_check(&app, &st).unwrap_or_else(|e| err(e)))
}
#[tauri::command]
async fn upd_download(app: AppHandle, w: WebviewWindow, st: State<'_, St>) -> Result<Value, String> {
    guard(&w)?;
    {
        let mut u = st.upd.lock().map_err(|e| e.to_string())?;
        if u.busy {
            return Ok(err("이미 내려받는 중이에요"));
        }
        u.busy = true;
    }
    let r = do_download(&app, &st);
    if let Ok(mut u) = st.upd.lock() {
        u.busy = false;
    }
    Ok(r.unwrap_or_else(|e| err(e)))
}
#[tauri::command]
async fn upd_install(app: AppHandle, w: WebviewWindow, st: State<'_, St>) -> Result<Value, String> {
    guard(&w)?;
    let file = st.upd.lock().ok().and_then(|u| u.file.clone());
    let Some(f) = file.filter(|f| f.exists()) else {
        return Ok(err("먼저 내려받아 주세요"));
    };
    match upd_mode() {
        "setup" => {
            // 설치 마법사를 열고 이 앱은 닫아요. 마법사가 끝나면 새 LAGO가 켜져요.
            if let Err(e) = Command::new(&f).spawn() {
                return Ok(err(e.to_string()));
            }
            let a = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(700));
                a.exit(0);
            });
            Ok(json!({ "ok": true, "how": "wizard" }))
        }
        "mac" => {
            let _ = open::that(&f);
            Ok(json!({ "ok": true, "how": "dmg" }))
        }
        _ => {
            let dl = app.path().download_dir().ok().and_then(|d| f.file_name().map(|n| d.join(n)));
            match dl {
                Some(d) if fs::copy(&f, &d).is_ok() => reveal(&d),
                _ => reveal(&f),
            }
            Ok(json!({ "ok": true, "how": "portable" }))
        }
    }
}

/* ---------- 창 ---------- */
// LAGO 주소에서 열린 화면에만 window.lagoDesktop 을 열어 줘요. (다른 주소에서는 아무것도 하지 않아요)
fn init_script(version: &str) -> String {
    let platform = if cfg!(target_os = "macos") {
        "darwin"
    } else if cfg!(windows) {
        "win32"
    } else {
        "linux"
    };
    format!(
        r#"(function(){{
if(location.origin!=={origin}||window.top!==window||window.lagoDesktop)return;
var inv=function(c,a){{return window.__TAURI_INTERNALS__.invoke(c,a||{{}});}};
var cbs=[];
Object.defineProperty(window,"__lagoUpd",{{value:function(k,d){{cbs.forEach(function(f){{try{{f(k,d);}}catch(e){{}}}});}}}});
Object.defineProperty(window,"lagoDesktop",{{value:Object.freeze({{
version:{version},platform:{platform},engine:"rust",
pickFolder:function(){{return inv("pick");}},
current:function(){{return inv("current");}},
list:function(){{return inv("list");}},
readFile:function(r){{return inv("read",{{rel:String(r||"")}});}},
writeFile:function(r,t){{return inv("write",{{rel:String(r||""),text:String(t||"")}});}},
run:function(c,d){{return inv("run",{{cmd:String(c||""),cwd:String(d||"")}});}},
updCheck:function(){{return inv("upd_check");}},
updDownload:function(){{return inv("upd_download");}},
updInstall:function(){{return inv("upd_install");}},
onUpd:function(cb){{if(typeof cb==="function")cbs.push(cb);}}
}})}});
addEventListener("keydown",function(e){{if(e.key==="F5"){{e.preventDefault();location.reload();}}}});
}})();"#,
        origin = json!(app_origin()),
        version = json!(version),
        platform = json!(platform),
    )
}
fn create_window(app: &AppHandle) -> tauri::Result<()> {
    let c = cfg(app);
    if let Some(r) = c["root"].as_str().map(PathBuf::from).filter(|p| p.is_dir()) {
        if let Ok(mut g) = app.state::<St>().root.lock() {
            *g = Some(r);
        }
    }
    let (w, h) = (c["w"].as_f64().unwrap_or(1280.0).clamp(380.0, 10000.0), c["h"].as_f64().unwrap_or(840.0).clamp(520.0, 10000.0));
    let version = app.package_info().version.to_string();
    let b = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("LAGO")
        .inner_size(w, h)
        .min_inner_size(380.0, 520.0)
        .initialization_script(init_script(&version).as_str())
        .on_navigation(|url| {
            // 앱 안에서는 LAGO와 로그인 화면만 열어요. 다른 사이트는 기본 브라우저로 보내요.
            match url.scheme() {
                "http" | "https" => {}
                _ => return true,
            }
            let local = matches!(url.host_str(), Some("tauri.localhost") | Some("localhost"));
            if local || is_app(url) || is_auth(url) {
                return true;
            }
            let _ = open::that(url.as_str());
            false
        });
    // 로그인 팝업(window.open)은 앱 안의 창으로, 그 밖의 새 창은 기본 브라우저로 열어요
    let b = b.on_new_window(|url, _features| {
        if is_app(&url) || is_auth(&url) || url.scheme() == "about" {
            return tauri::webview::NewWindowResponse::Allow;
        }
        if matches!(url.scheme(), "http" | "https") {
            let _ = open::that(url.as_str());
        }
        tauri::webview::NewWindowResponse::Deny
    });
    // Google 로그인이 "안전하지 않은 브라우저"로 막히지 않게 Mac에서는 Safari와 같은 표시를 써요
    #[cfg(target_os = "macos")]
    let b = b.user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15");
    b.build()?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(St::default())
        .invoke_handler(tauri::generate_handler![pick, current, list, read, write, run, upd_check, upd_download, upd_install])
        .setup(|app| {
            let h = app.handle().clone();
            create_window(&h)?;
            // 켜고 조금 뒤에 새 버전이 있는지 한 번 확인해요
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_secs(8));
                let st = h.state::<St>();
                if let Ok(i) = do_check(&h, &st) {
                    if i["newer"].as_bool() == Some(true) {
                        say(&h, "avail", &i);
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    if let (Ok(sz), Ok(sf)) = (window.inner_size(), window.scale_factor()) {
                        let l = sz.to_logical::<f64>(sf);
                        set_cfg(window.app_handle(), json!({ "w": l.width.round(), "h": l.height.round() }));
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("LAGO를 시작하지 못했어요");
}
