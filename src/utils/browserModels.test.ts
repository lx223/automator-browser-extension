import { describe, expect, it } from 'vitest';
import { create, fromBinary, fromJson, toBinary, toJson } from '@bufbuild/protobuf';
import { GroupSchema, TabSchema, WindowSchema } from '@/generated/workspace_pb';
import { createTabFromChrome } from './tab';
import { createGroupFromChrome } from './group';
import { createWindowFromChrome } from './window';

const chromeTab: chrome.tabs.Tab = {
  frozen: false,
  discarded: false,
  autoDiscardable: true,
  id: 0,
  windowId: 7,
  index: 2,
  groupId: -1,
  active: true,
  pinned: false,
  highlighted: true,
  incognito: false,
  selected: true,
  url: 'https://example.com',
  title: 'Example',
  mutedInfo: { muted: true, reason: 'user' },
};

describe('browser model serialization', () => {
  it('preserves zero IDs, negative group IDs, and nested audio state', () => {
    const tab = createTabFromChrome(chromeTab);
    expect(tab.id).toBe(0);
    expect(tab.groupId).toBe(-1);
    expect(tab.mutedInfo?.reason).toBe('user');
    expect(tab.muted).toBe(true);
    expect('selected' in tab).toBe(false);
    expect(fromBinary(TabSchema, toBinary(TabSchema, tab))).toEqual(tab);
  });

  it('preserves missing permission-restricted metadata', () => {
    const { url: _url, title: _title, groupId: _groupId, ...restrictedTab } = chromeTab;
    const tab = createTabFromChrome(restrictedTab as chrome.tabs.Tab);
    const decoded = fromBinary(TabSchema, toBinary(TabSchema, tab));
    expect(decoded.url).toBeUndefined();
    expect(decoded.title).toBeUndefined();
    expect(decoded.groupId).toBeUndefined();
    expect(decoded.pinned).toBe(false);
  });

  it('round trips groups without titles', () => {
    const group = createGroupFromChrome({ id: 3, windowId: 7, color: 'blue' as chrome.tabGroups.Color, shared: false, collapsed: true });
    expect(fromBinary(GroupSchema, toBinary(GroupSchema, group))).toEqual(group);
    expect(group.title).toBeUndefined();
  });

  it('handles unpopulated windows and nested tab serialization', () => {
    const chromeWindow: chrome.windows.Window = {
      id: 7, focused: true, incognito: false, alwaysOnTop: false,
      left: -1200, state: 'normal', type: 'normal',
    };
    expect(createWindowFromChrome(chromeWindow).tabs).toEqual([]);
    const window = createWindowFromChrome({ ...chromeWindow, tabs: [chromeTab] });
    expect(fromBinary(WindowSchema, toBinary(WindowSchema, window))).toEqual(window);
    expect(fromJson(WindowSchema, toJson(WindowSchema, window))).toEqual(window);
    expect(window.left).toBe(-1200);
    expect(create(WindowSchema, JSON.parse(JSON.stringify(window)))).toEqual(window);
  });
});
