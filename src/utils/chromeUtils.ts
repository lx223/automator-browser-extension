export async function getAllWindows(): Promise<chrome.windows.Window[]> {
  return chrome.windows.getAll({ populate: true });
}

export async function getAllTabs(): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({});
}

export async function getTabsForWindow(windowId: number): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({ windowId });
}

export async function getAllTabGroups(): Promise<chrome.tabGroups.TabGroup[]> {
  return chrome.tabGroups.query({});
}

export async function getTabGroupsForWindow(windowId: number): Promise<chrome.tabGroups.TabGroup[]> {
  return chrome.tabGroups.query({ windowId });
}

export async function updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> {
  return chrome.tabs.update(tabId, updateProperties);
}

export async function moveTab(tabId: number, moveProperties: chrome.tabs.MoveProperties): Promise<chrome.tabs.Tab> {
  return chrome.tabs.move(tabId, moveProperties);
}

export async function removeTab(tabId: number): Promise<void> {
  return chrome.tabs.remove(tabId);
}

export async function createTab(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create(createProperties);
}

export async function getTab(tabId: number): Promise<chrome.tabs.Tab> {
  return chrome.tabs.get(tabId);
}

export async function captureVisibleTab(windowId: number, options?: chrome.tabs.CaptureVisibleTabOptions): Promise<string> {
  // Always use the Promise-based overload by providing options (default to empty object if not provided)
  return chrome.tabs.captureVisibleTab(windowId, options || {});
}

export async function getWindow(windowId: number): Promise<chrome.windows.Window> {
  return chrome.windows.get(windowId);
}

export async function createWindow(createData: chrome.windows.CreateData): Promise<chrome.windows.Window> {
  return chrome.windows.create(createData);
}

export async function removeWindow(windowId: number): Promise<void> {
  return chrome.windows.remove(windowId);
}

export async function updateWindow(windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<chrome.windows.Window> {
  return chrome.windows.update(windowId, updateInfo);
}
