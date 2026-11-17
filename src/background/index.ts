async function openExtensionPage() {
  const extensionUrl = chrome.runtime.getURL('index.html');
  const tabs = await chrome.tabs.query({ url: extensionUrl });

  if (tabs.length > 0) {
    const existingTab = tabs[0];
    await chrome.tabs.update(existingTab.id!, { active: true });
    if (existingTab.windowId) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: extensionUrl });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('OverTabbed extension installed');
});

chrome.action.onClicked.addListener(() => {
  void openExtensionPage();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-extensions-page') {
    void openExtensionPage();
  }
});
