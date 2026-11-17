import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType, createActionMatcher } from '@/utils/rule';
import { executeAction } from './actions';
import { makeTab, resetTabIds } from './testUtils';

const tabsApi = vi.mocked(chrome.tabs);
const groupsApi = vi.mocked(chrome.tabGroups);

describe('executeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTabIds();
    tabsApi.remove.mockResolvedValue(undefined as never);
    tabsApi.update.mockResolvedValue(undefined as never);
    tabsApi.discard.mockResolvedValue(undefined as never);
  });

  it('closes every tab and counts failures as unaffected', async () => {
    tabsApi.remove.mockResolvedValueOnce(undefined as never).mockRejectedValueOnce(new Error('gone') as never);

    const affected = await executeAction(createActionMatcher({ type: ActionType.CLOSE }), [makeTab(), makeTab()]);

    expect(tabsApi.remove).toHaveBeenCalledTimes(2);
    expect(affected).toBe(1);
  });

  it('pins only tabs that are not pinned yet', async () => {
    const affected = await executeAction(createActionMatcher({ type: ActionType.PIN }), [makeTab(), makeTab({ pinned: true })]);

    expect(tabsApi.update).toHaveBeenCalledExactlyOnceWith(1, { pinned: true });
    expect(affected).toBe(1);
  });

  it('unpins only pinned tabs', async () => {
    await executeAction(createActionMatcher({ type: ActionType.UNPIN }), [makeTab(), makeTab({ pinned: true })]);

    expect(tabsApi.update).toHaveBeenCalledExactlyOnceWith(2, { pinned: false });
  });

  it('skips active and already discarded tabs when discarding', async () => {
    await executeAction(createActionMatcher({ type: ActionType.DISCARD }), [
      makeTab(),
      makeTab({ active: true }),
      makeTab({ discarded: true }),
    ]);

    expect(tabsApi.discard).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('mutes only tabs that are not muted', async () => {
    await executeAction(createActionMatcher({ type: ActionType.MUTE }), [makeTab(), makeTab({ mutedInfo: { muted: true } })]);

    expect(tabsApi.update).toHaveBeenCalledExactlyOnceWith(1, { muted: true });
  });

  it('creates a named group per window when none exists', async () => {
    groupsApi.query.mockResolvedValue([] as never);
    tabsApi.group.mockResolvedValue(77 as never);
    const matcher = createActionMatcher({ type: ActionType.MOVE_TO_GROUP, params: { groupName: 'Docs', groupColor: 'green' } });

    const affected = await executeAction(matcher, [makeTab(), makeTab(), makeTab({ windowId: 2 })]);

    expect(tabsApi.group).toHaveBeenCalledWith({ tabIds: [1, 2], createProperties: { windowId: 1 } });
    expect(tabsApi.group).toHaveBeenCalledWith({ tabIds: [3], createProperties: { windowId: 2 } });
    expect(groupsApi.update).toHaveBeenCalledWith(77, { title: 'Docs', color: 'green' });
    expect(affected).toBe(3);
  });

  it('reuses an existing group and skips tabs already in it', async () => {
    groupsApi.query.mockResolvedValue([{ id: 9, title: 'Docs', windowId: 1 }] as never);
    tabsApi.group.mockResolvedValue(9 as never);
    const matcher = createActionMatcher({ type: ActionType.MOVE_TO_GROUP, params: { groupName: 'Docs' } });

    const affected = await executeAction(matcher, [makeTab({ groupId: 9 }), makeTab()]);

    expect(tabsApi.group).toHaveBeenCalledExactlyOnceWith({ groupId: 9, tabIds: [2] });
    expect(groupsApi.update).not.toHaveBeenCalled();
    expect(affected).toBe(1);
  });

  it('does nothing when the group name is missing', async () => {
    const affected = await executeAction(createActionMatcher({ type: ActionType.MOVE_TO_GROUP }), [makeTab()]);

    expect(tabsApi.group).not.toHaveBeenCalled();
    expect(affected).toBe(0);
  });
});
