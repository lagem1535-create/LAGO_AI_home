// LAGO 크롬 확장 — 옆 패널 채팅. 로그인은 LAGO 사이트와 같은 계정(Firebase)을 써요.
(() => {
  "use strict";
  const DEFAULT_BASE = "https://lago-ai-home.lagem1535.workers.dev";
  const $ = (s) => document.querySelector(s);
  const store = {
    get: (k) => new Promise((r) => chrome.storage.local.get(k, (o) => r(o ? o[k] : undefined))),
    set: (k, v) => new Promise((r) => chrome.storage.local.set({ [k]: v }, r)),
  };
  let BASE = DEFAULT_BASE, cfg = {}, mode = "ask", sessions = [], cur = null, page = null, busy = false;
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- 서버 · 로그인 ---------- */
  async function api(p, opt) {
    let r;
    try { r = await fetch(BASE + p, opt); } catch { throw new Error("LAGO 서버에 연결하지 못했어요. 인터넷을 확인해 주세요."); }
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }
  async function apiKey() {
    if (cfg.apiKey) return cfg.apiKey;
    const { j } = await api("/api/config");
    const k = j && j.firebase && j.firebase.apiKey;
    if (!k) throw new Error("서버에서 로그인 설정을 받지 못했어요.");
    cfg.apiKey = k; await store.set("lago_cfg", cfg);
    return k;
  }
  async function gpost(url, body, form) {
    const r = await fetch(url, { method: "POST", headers: { "content-type": form ? "application/x-www-form-urlencoded" : "application/json" }, body: form ? new URLSearchParams(body).toString() : JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const m = ((j.error && j.error.message) || "").split(" ")[0];
      const KO = { INVALID_LOGIN_CREDENTIALS: "이메일이나 비밀번호가 맞지 않아요.", INVALID_PASSWORD: "비밀번호가 맞지 않아요.", EMAIL_NOT_FOUND: "가입하지 않은 이메일이에요.", USER_DISABLED: "정지된 계정이에요.", TOKEN_EXPIRED: "로그인이 만료됐어요. 다시 로그인해 주세요.", INVALID_REFRESH_TOKEN: "연결 코드가 맞지 않아요.", TOO_MANY_ATTEMPTS_TRY_LATER: "너무 많이 시도했어요. 잠시 뒤에 다시 해 주세요." };
      throw new Error(KO[m] || "로그인하지 못했어요" + (m ? " (" + m + ")" : ""));
    }
    return j;
  }
  async function idToken() {
    if (!cfg.refreshToken) return null;
    if (cfg.idToken && cfg.exp && Date.now() < cfg.exp - 60000) return cfg.idToken;
    const j = await gpost("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(await apiKey()), { grant_type: "refresh_token", refresh_token: cfg.refreshToken }, true);
    cfg = { ...cfg, idToken: j.id_token, refreshToken: j.refresh_token || cfg.refreshToken, exp: Date.now() + Number(j.expires_in || 3600) * 1000 };
    await store.set("lago_cfg", cfg);
    return j.id_token;
  }

  /* ---------- 글 꾸미기 (간단 마크다운) ---------- */
  const inl = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  function md(t) {
    const parts = String(t || "").split("```");
    let out = "";
    parts.forEach((p, i) => {
      if (i % 2) {
        const nl = p.indexOf("\n"), lang = (nl < 0 ? "" : p.slice(0, nl)).trim(), code = (nl < 0 ? p : p.slice(nl + 1)).replace(/\n$/, "");
        out += `<div class="cw"><div class="cb"><span>${esc(lang || "code")}</span><span class="grow"></span><button data-cp>복사</button></div><pre><code>${esc(code)}</code></pre></div>`;
        return;
      }
      let list = null;
      const close = () => { if (list) { out += `</${list}>`; list = null; } };
      for (const raw of p.split("\n")) {
        const line = raw.trimEnd();
        let m;
        if ((m = /^\s*[-*•]\s+(.*)/.exec(line))) { if (list !== "ul") { close(); out += "<ul>"; list = "ul"; } out += `<li>${inl(m[1])}</li>`; }
        else if ((m = /^\s*\d+[.)]\s+(.*)/.exec(line))) { if (list !== "ol") { close(); out += "<ol>"; list = "ol"; } out += `<li>${inl(m[1])}</li>`; }
        else if ((m = /^#{1,4}\s+(.*)/.exec(line))) { close(); out += `<h4>${inl(m[1])}</h4>`; }
        else if (!line.trim()) close();
        else { close(); out += `<p>${inl(line)}</p>`; }
      }
      close();
    });
    return out;
  }

  /* ---------- 대화 화면 ---------- */
  const chat = $("#chat");
  function draw() {
    const msgs = (cur && cur.msgs) || [];
    if (!msgs.length) {
      chat.innerHTML = `<div class="hello"><b>무엇을 도와 드릴까요?</b>보고 있는 페이지를 요약하거나, 드래그한 글을 설명해 드려요.<br>글을 선택하고 <b style="display:inline;font-size:inherit">오른쪽 클릭 → LAGO에게 설명 부탁</b>도 돼요.</div>`;
      return;
    }
    chat.innerHTML = msgs.map((m) => m.r === "u"
      ? `<div class="m u">${esc(m.t)}</div>`
      : `<div class="m a">${m.wait ? '<span class="think"><i></i><i></i><i></i> 생각하는 중…</span>' : m.err ? `<span class="err">${esc(m.t)}</span>` : md(m.t)}${(m.src || []).length ? `<div class="src">${m.src.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">[${s.n}] ${esc(s.title)}</a>`).join("")}</div>` : ""}</div>`).join("");
    chat.scrollTop = chat.scrollHeight;
  }
  chat.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cp]"); if (!b) return;
    const t = b.closest(".cw").querySelector("pre").textContent;
    navigator.clipboard.writeText(t).then(() => { b.textContent = "복사됨"; setTimeout(() => (b.textContent = "복사"), 1400); }).catch(() => { b.textContent = "복사 실패"; });
  });

  async function saveSess() {
    if (!cur || !cur.msgs.some((m) => m.r === "u")) return;
    cur.updated = Date.now();
    if (!cur.title) cur.title = cur.msgs.find((m) => m.r === "u").t.replace(/\s+/g, " ").slice(0, 36);
    const clean = { ...cur, msgs: cur.msgs.filter((m) => !m.wait).slice(-40) };
    sessions = [clean, ...sessions.filter((s) => s.id !== cur.id)].slice(0, 30);
    await store.set("lago_sessions", sessions);
  }
  function newSess() { cur = { id: rid(), title: "", msgs: [], updated: Date.now() }; page = null; showAtt(); draw(); }

  function showAtt() {
    const a = $("#att");
    a.hidden = !page;
    if (page) $("#attt").textContent = "" + (page.mode === "sel" ? "선택한 글 · " : "") + (page.title || page.url || "이 페이지").slice(0, 60);
  }
  $("#attx").onclick = () => { page = null; showAtt(); };

  /* ---------- 페이지 읽기 ---------- */
  function readFn() {
    const sel = String(getSelection() || "").trim();
    const root = document.querySelector("article,main,[role=main]") || document.body;
    const text = (root.innerText || "").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
    return { title: document.title || "", url: location.href, sel: sel.slice(0, 6000), text: text.slice(0, 8000) };
  }
  async function getPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || "")) throw new Error("일반 웹페이지에서 써 주세요. (이 탭은 읽을 수 없어요)");
    const run = () => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readFn });
    let r;
    try { [r] = await run(); }
    catch {
      const ok = await chrome.permissions.request({ origins: ["http://*/*", "https://*/*"] }).catch(() => false);
      if (!ok) throw new Error("페이지를 읽도록 허락해 주세요. (한 번만 물어봐요)");
      try { [r] = await run(); } catch { throw new Error("이 페이지는 읽지 못했어요."); }
    }
    if (!r || !r.result) throw new Error("이 페이지는 읽지 못했어요.");
    return r.result;
  }

  /* ---------- 보내기 ---------- */
  async function wikiOnly(q) {
    const { j } = await api("/api/wiki?q=" + encodeURIComponent(q.slice(0, 100)));
    if (!j.found || !j.results || !j.results.length) return { t: "위키백과에서 찾지 못했어요. 위쪽 사람 아이콘에서 로그인하면 모델이 답해요.", src: [] };
    const r = j.results[0];
    return { t: `**${r.title}**\n${r.extract || ""}\n\n(로그인하지 않아 위키백과 내용만 보여 드려요)`, src: r.url ? [{ n: 1, title: r.title, url: r.url }] : [] };
  }
  async function ask(q, opt = {}) {
    if (busy || !q.trim()) return;
    if (!cur) newSess();
    busy = true; $("#bSend").disabled = true;
    cur.msgs.push({ r: "u", t: (opt.label || q).trim() });
    const w = { r: "a", t: "", wait: true }; cur.msgs.push(w); draw();
    try {
      const tok = await idToken();
      let ans;
      if (!tok) ans = (opt.needLogin ? { t: "이 기능은 로그인이 필요해요. 위쪽 사람 아이콘 → 로그인.", src: [] } : await wikiOnly(q));
      else {
        const hist = cur.msgs.filter((m) => !m.wait && !m.err).slice(-6, -2).map((m) => ({ r: m.r, t: m.t.slice(0, 300) }));
        const ctx = opt.ctx !== undefined ? opt.ctx : (page ? (page.mode === "sel" ? page.sel : page.text) : "");
        const body = { task: opt.task || (mode === "code" ? "code" : "ask"), q, hist: hist.slice(-4) };
        if (ctx) { body.ctx = ctx.slice(0, 8000); body.page = true; }
        const r = await api("/api/chat", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + tok }, body: JSON.stringify(body) });
        if (r.status === 401) { w.err = true; ans = { t: "로그인이 만료됐어요. 다시 로그인해 주세요." }; }
        else if (r.j.pending) ans = { t: "이 질문은 연결된 서비스(MCP) 허락이 필요해요. 사이트에서 물어봐 주세요.", src: [] };
        else if (!r.ok || !r.j.answer) { w.err = true; ans = { t: r.j.error || "답을 받지 못했어요. 잠시 뒤에 다시 해 주세요." }; }
        else ans = { t: r.j.answer, src: (r.j.sources || []).filter((s) => s.cited !== false && s.url).slice(0, 5) };
      }
      w.t = ans.t; w.src = ans.src || []; w.wait = false;
    } catch (e) { w.t = e.message; w.err = true; w.wait = false; }
    busy = false; $("#bSend").disabled = false; draw(); saveSess();
  }

  /* ---------- 입력 · 칩 ---------- */
  const q = $("#q");
  const grow = () => { q.style.height = "auto"; q.style.height = Math.min(140, q.scrollHeight) + "px"; };
  q.addEventListener("input", grow);
  q.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("#f").requestSubmit(); } });
  $("#f").addEventListener("submit", (e) => { e.preventDefault(); const t = q.value.trim(); if (!t) return; q.value = ""; grow(); ask(t); });

  async function chip(kind) {
    try {
      page = await getPage(); page.mode = kind === "sel" ? "sel" : "page"; showAtt();
      if (kind === "page") return ask("이 페이지를 핵심만 요약해 줘", { task: "summary", ctx: page.text, label: "이 페이지 요약", needLogin: true });
      if (kind === "sel") {
        if (!page.sel) { toast("페이지에서 글을 드래그해 선택한 뒤 눌러 주세요."); page.sel = ""; return; }
        return ask("선택한 글을 쉽게 설명해 줘", { ctx: page.sel, label: "선택한 글 설명" });
      }
      q.placeholder = "이 페이지에 대해 질문하세요"; q.focus();
    } catch (e) { toast(e.message); }
  }
  document.querySelectorAll("#chips button").forEach((b) => (b.onclick = () => chip(b.dataset.q)));
  function toast(m) {
    if (!cur) newSess();
    cur.msgs.push({ r: "a", t: m, err: true }); draw();
    cur.msgs.pop();
  }

  document.querySelectorAll("#mode button").forEach((b) => (b.onclick = () => {
    mode = b.dataset.m;
    document.querySelectorAll("#mode button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    q.placeholder = mode === "code" ? "만들고 싶은 코드를 말해 주세요" : "LAGO에게 물어보세요";
  }));
  $("#bNew").onclick = () => { newSess(); q.focus(); };

  /* ---------- 지난 대화 ---------- */
  function drawHist() {
    $("#hlist").innerHTML = sessions.length ? sessions.map((s) => `<div class="hi ${cur && cur.id === s.id ? "on" : ""}" data-id="${s.id}"><span class="t">${esc(s.title || "(제목 없음)")}<small>${new Date(s.updated).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · ${s.msgs.filter((m) => m.r === "u").length}번</small></span><button class="ib" data-del="${s.id}" aria-label="지우기"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div>`).join("") : '<p class="muted" style="padding:14px">저장된 대화가 없어요.</p>';
  }
  $("#bHist").onclick = () => { drawHist(); $("#hist").hidden = false; };
  $("#hX").onclick = () => ($("#hist").hidden = true);
  $("#hlist").addEventListener("click", async (e) => {
    const d = e.target.closest("[data-del]");
    if (d) { sessions = sessions.filter((s) => s.id !== d.dataset.del); await store.set("lago_sessions", sessions); if (cur && cur.id === d.dataset.del) newSess(); drawHist(); return; }
    const r = e.target.closest("[data-id]"); if (!r) return;
    const s = sessions.find((x) => x.id === r.dataset.id); if (!s) return;
    cur = JSON.parse(JSON.stringify(s)); page = null; showAtt(); draw(); $("#hist").hidden = true;
  });

  /* ---------- 계정 메뉴 · 로그인 ---------- */
  function showLogin(on) { $("#login").hidden = !on; if (on) { $("#lerr").textContent = ""; $("#lmail").focus(); } }
  document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#fMail").hidden = b.dataset.t !== "mail"; $("#fCode").hidden = b.dataset.t !== "code";
  }));
  async function done(email) { await store.set("lago_cfg", cfg); showLogin(false); if (!cur) newSess(); cur.msgs.push({ r: "a", t: email + " 으로 로그인했어요." }); draw(); }
  $("#fMail").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#lerr").textContent = "";
    try {
      const j = await gpost("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(await apiKey()), { email: $("#lmail").value.trim(), password: $("#lpw").value, returnSecureToken: true });
      cfg = { ...cfg, refreshToken: j.refreshToken, idToken: j.idToken, exp: Date.now() + Number(j.expiresIn || 3600) * 1000, email: j.email };
      $("#lpw").value = ""; await done(j.email);
    } catch (er) { $("#lerr").textContent = er.message; }
  });
  $("#fCode").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#lerr").textContent = "";
    try {
      const key = await apiKey(), code = $("#lcode").value.trim();
      const j = await gpost("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(key), { grant_type: "refresh_token", refresh_token: code }, true);
      const lk = await gpost("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(key), { idToken: j.id_token });
      const email = (lk.users && lk.users[0] && lk.users[0].email) || "계정";
      cfg = { ...cfg, refreshToken: j.refresh_token || code, idToken: j.id_token, exp: Date.now() + Number(j.expires_in || 3600) * 1000, email };
      $("#lcode").value = ""; await done(email);
    } catch (er) { $("#lerr").textContent = er.message; }
  });
  $("#lskip").onclick = () => showLogin(false);
  $("#bMenu").onclick = () => {
    const m = $("#menu");
    if (!m.hidden) { m.hidden = true; return; }
    m.innerHTML = cfg.refreshToken
      ? `<div>${esc(cfg.email || "로그인됨")}</div><button data-a="site">LAGO 사이트 열기</button><button data-a="out">로그아웃</button>`
      : `<div>로그인하지 않았어요</div><button data-a="in">로그인</button><button data-a="site">LAGO 사이트 열기</button>`;
    m.hidden = false;
  };
  $("#menu").addEventListener("click", async (e) => {
    const a = e.target.dataset && e.target.dataset.a; if (!a) return;
    $("#menu").hidden = true;
    if (a === "in") showLogin(true);
    else if (a === "site") chrome.tabs.create({ url: BASE });
    else if (a === "out") { cfg = { apiKey: cfg.apiKey }; await store.set("lago_cfg", cfg); if (!cur) newSess(); cur.msgs.push({ r: "a", t: "로그아웃했어요." }); draw(); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest("#menu") && !e.target.closest("#bMenu")) $("#menu").hidden = true; });

  /* ---------- 오른쪽 클릭 메뉴에서 온 요청 ---------- */
  async function takePending() {
    let p; try { p = (await chrome.storage.session.get("pending")).pending; } catch { return; }
    if (!p || Date.now() - p.at > 30000) return;
    await chrome.storage.session.remove("pending");
    newSess();
    if (p.kind === "sel") { page = { title: p.title, url: p.url, sel: p.text, text: "", mode: "sel" }; showAtt(); ask("선택한 글을 쉽게 설명해 줘", { ctx: p.text, label: "선택한 글 설명" }); }
    else chip("page");
  }
  try { chrome.storage.onChanged.addListener((c, area) => { if (area === "session" && c.pending && c.pending.newValue) takePending(); }); } catch {}

  /* ---------- 시작 ---------- */
  (async () => {
    cfg = (await store.get("lago_cfg")) || {};
    sessions = (await store.get("lago_sessions")) || [];
    BASE = ((await store.get("lago_base")) || DEFAULT_BASE).replace(/\/+$/, "");
    newSess();
    if (!cfg.refreshToken) $("#note").textContent = "로그인하지 않으면 위키백과 내용만 보여 드려요 · 위쪽 사람 아이콘에서 로그인";
    await takePending();
  })();
})();
