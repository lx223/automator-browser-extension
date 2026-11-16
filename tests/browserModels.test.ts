import assert from 'node:assert/strict';
import { test } from 'node:test';
import { create, fromBinary, fromJson, toBinary, toJson } from '@bufbuild/protobuf';
import { GroupSchema, TabSchema, WindowSchema } from '../src/gen/browser/v1/browser_pb';
import { groupFromChrome, tabFromChrome, windowFromChrome } from '../src/utils/browserModels';

const chromeTab: chrome.tabs.Tab = {
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

test('tab mapping preserves zero IDs, negative group sentinel, and nested audio state', () => {
  const tab = tabFromChrome(chromeTab);
  assert.equal(tab.id, 0);
  assert.equal(tab.groupId, -1);
  assert.equal(tab.mutedInfo?.reason, 'user');
  assert.equal('selected' in tab, false);
  const message = create(TabSchema, tab);
  assert.deepEqual(fromBinary(TabSchema, toBinary(TabSchema, message)), message);
});

test('unavailable tab fields stay absent rather than becoming empty strings or zero IDs', () => {
  const { id: _id, url: _url, title: _title, groupId: _groupId, ...restrictedTab } = chromeTab;
  const message = create(TabSchema, tabFromChrome(restrictedTab));
  const decoded = fromBinary(TabSchema, toBinary(TabSchema, message));
  assert.equal(decoded.id, undefined);
  assert.equal(decoded.url, undefined);
  assert.equal(decoded.title, undefined);
  assert.equal(decoded.groupId, undefined);
  assert.equal(decoded.pinned, false);
});

test('group mapping round trips optional title, color, and collapsed state', () => {
  const group = groupFromChrome({ id: 3, windowId: 7, color: 'blue', collapsed: true });
  const message = create(GroupSchema, group);
  const decoded = fromBinary(GroupSchema, toBinary(GroupSchema, message));
  assert.deepEqual(decoded, message);
  assert.equal(decoded.title, undefined);
});

test('window mapping supports unpopulated windows and nested tab serialization', () => {
  const window: chrome.windows.Window = {
    id: 7, focused: true, incognito: false, alwaysOnTop: false,
    left: -1200, state: 'normal', type: 'normal',
  };
  assert.deepEqual(windowFromChrome(window).tabs, []);
  const mapped = windowFromChrome({ ...window, tabs: [chromeTab] });
  const message = create(WindowSchema, mapped);
  assert.deepEqual(fromBinary(WindowSchema, toBinary(WindowSchema, message)), message);
  assert.deepEqual(fromJson(WindowSchema, toJson(WindowSchema, message)), message);
  assert.equal(message.left, -1200);
  // Chrome messaging/storage clones plain JSON; reconstruct before protobuf encoding.
  const stored = JSON.parse(JSON.stringify(mapped));
  assert.deepEqual(create(WindowSchema, stored), message);
});
