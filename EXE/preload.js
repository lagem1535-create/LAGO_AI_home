// LAGO 주소에서 열린 페이지에만 window.lagoDesktop 을 열어 줘요.
const { contextBridge, ipcRenderer } = require("electron");
const arg = (k) => { const a = process.argv.find((x) => x.startsWith("--" + k + "=")); return a ? a.slice(k.length + 3) : ""; };
const ORIGIN = arg("lago-origin");
if (location.origin === ORIGIN) {
  contextBridge.exposeInMainWorld("lagoDesktop", {
    version: arg("lago-version"),
    platform: process.platform,
    pickFolder: () => ipcRenderer.invoke("lago:pick"),
    current: () => ipcRenderer.invoke("lago:current"),
    list: () => ipcRenderer.invoke("lago:list"),
    readFile: (rel) => ipcRenderer.invoke("lago:read", String(rel || "")),
    writeFile: (rel, text) => ipcRenderer.invoke("lago:write", String(rel || ""), String(text || "")),
    run: (cmd, cwd) => ipcRenderer.invoke("lago:run", String(cmd || ""), String(cwd || "")),
  });
}
if (location.origin === ORIGIN) {
  // 다크 모드가 바뀌면 창 단추 색도 맞춰요
  const send = () => ipcRenderer.send("lago:theme", document.documentElement.getAttribute("data-lago") === "dark");
  window.addEventListener("DOMContentLoaded", () => {
    send();
    new MutationObserver(send).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lago"] });
  });
}
if (location.protocol === "file:") contextBridge.exposeInMainWorld("lagoRetry", () => ipcRenderer.send("lago:retry"));
