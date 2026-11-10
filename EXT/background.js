// LAGO 확장 프로그램 — 아이콘을 누르면 옆 패널이 열리고, 오른쪽 클릭 메뉴로 선택한 글 · 페이지를 바로 물어볼 수 있어요.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "lago-sel", title: "LAGO에게 설명 부탁: “%s”", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "lago-page", title: "LAGO로 이 페이지 요약", contexts: ["page"] });
  });
});
chrome.runtime.onStartup.addListener(() => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {}));

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;
  const pending = info.menuItemId === "lago-sel"
    ? { kind: "sel", text: String(info.selectionText || "").slice(0, 6000), title: tab.title || "", url: tab.url || "", at: Date.now() }
    : { kind: "page", title: tab.title || "", url: tab.url || "", at: Date.now() };
  await chrome.storage.session.set({ pending });
  try { await chrome.sidePanel.open({ tabId: tab.id }); } catch (e) {}
});
