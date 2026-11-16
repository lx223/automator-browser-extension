import { create } from '@bufbuild/protobuf';
import { GroupSchema, TabSchema, WindowSchema } from '../gen/browser/v1/browser_pb';
import type { Group, Tab, Window } from '../types/browser';

export function tabFromChrome(tab: chrome.tabs.Tab): Tab {
  return create(TabSchema, tab);
}

export function groupFromChrome(group: chrome.tabGroups.TabGroup): Group {
  return create(GroupSchema, group);
}

export function windowFromChrome(window: chrome.windows.Window): Window {
  return create(WindowSchema, {
    ...window,
    tabs: window.tabs?.map(tabFromChrome) ?? [],
  });
}
