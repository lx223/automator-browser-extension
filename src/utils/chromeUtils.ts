import type { Tab, Group, Window } from '../types/browser';
import { tabFromChrome, groupFromChrome, windowFromChrome } from './browserModels';

export async function getAllWindows(): Promise<Window[]> {
  return (await chrome.windows.getAll({ populate: true })).map(windowFromChrome);
}

export async function getAllTabs(): Promise<Tab[]> {
  return (await chrome.tabs.query({})).map(tabFromChrome);
}

export async function getTabsForWindow(windowId: number): Promise<Tab[]> {
  return (await chrome.tabs.query({ windowId })).map(tabFromChrome);
}

export async function getAllTabGroups(): Promise<Group[]> {
  return (await chrome.tabGroups.query({})).map(groupFromChrome);
}

export async function getTabGroupsForWindow(windowId: number): Promise<Group[]> {
  return (await chrome.tabGroups.query({ windowId })).map(groupFromChrome);
}

export async function updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<Tab> {
  return tabFromChrome(await chrome.tabs.update(tabId, updateProperties));
}

export async function moveTab(tabId: number, moveProperties: chrome.tabs.MoveProperties): Promise<Tab> {
  return tabFromChrome(await chrome.tabs.move(tabId, moveProperties));
}

export async function removeTab(tabId: number): Promise<void> {
  return chrome.tabs.remove(tabId);
}

export async function createTab(createProperties: chrome.tabs.CreateProperties): Promise<Tab> {
  return tabFromChrome(await chrome.tabs.create(createProperties));
}

export async function getTab(tabId: number): Promise<Tab> {
  return tabFromChrome(await chrome.tabs.get(tabId));
}

export async function captureVisibleTab(windowId: number, options?: chrome.tabs.CaptureVisibleTabOptions): Promise<string> {
  // Always use the Promise-based overload by providing options (default to empty object if not provided)
  return chrome.tabs.captureVisibleTab(windowId, options || {});
}

export async function getWindow(windowId: number): Promise<Window> {
  return windowFromChrome(await chrome.windows.get(windowId));
}

export async function createWindow(createData: chrome.windows.CreateData): Promise<Window> {
  return windowFromChrome(await chrome.windows.create(createData));
}

export async function removeWindow(windowId: number): Promise<void> {
  return chrome.windows.remove(windowId);
}

export async function updateWindow(windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<Window> {
  return windowFromChrome(await chrome.windows.update(windowId, updateInfo));
}
