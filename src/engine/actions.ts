import { ActionType } from '@/utils/rule';
import type { ActionMatcher } from '@/utils/rule';
import type { BrowserTab } from './matcher';

async function applyToEach(tabs: BrowserTab[], apply: (tab: BrowserTab) => Promise<unknown>): Promise<number> {
  let affected = 0;
  for (const tab of tabs) {
    try {
      await apply(tab);
      affected += 1;
    } catch (error) {
      console.warn('Rule action failed for tab', tab.id, error);
    }
  }
  return affected;
}

async function closeTabs(tabs: BrowserTab[]): Promise<number> {
  return applyToEach(tabs, (tab) => chrome.tabs.remove(tab.id!));
}

async function moveToGroup(tabs: BrowserTab[], matcher: ActionMatcher): Promise<number> {
  const title = matcher.params?.groupName?.trim();
  if (!title) {
    return 0;
  }
  const color = matcher.params?.groupColor as chrome.tabGroups.UpdateProperties['color'];

  const byWindow = new Map<number, BrowserTab[]>();
  for (const tab of tabs) {
    byWindow.set(tab.windowId, [...(byWindow.get(tab.windowId) ?? []), tab]);
  }

  let affected = 0;
  for (const [windowId, windowTabs] of byWindow) {
    try {
      const groups = await chrome.tabGroups.query({ windowId });
      const existing = groups.find((group) => group.title === title);
      const pending = windowTabs.filter((tab) => !existing || tab.groupId !== existing.id);
      if (pending.length === 0) {
        continue;
      }
      const tabIds = pending.map((tab) => tab.id!) as [number, ...number[]];
      if (existing) {
        await chrome.tabs.group({ groupId: existing.id, tabIds });
      } else {
        const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId } });
        await chrome.tabGroups.update(groupId, color ? { title, color } : { title });
      }
      affected += pending.length;
    } catch (error) {
      console.warn('Rule action failed for window', windowId, error);
    }
  }
  return affected;
}

export async function executeAction(matcher: ActionMatcher, tabs: BrowserTab[]): Promise<number> {
  switch (matcher.type) {
    case ActionType.CLOSE:
      return closeTabs(tabs);
    case ActionType.MOVE_TO_GROUP:
      return moveToGroup(tabs, matcher);
    case ActionType.PIN:
      return applyToEach(
        tabs.filter((tab) => !tab.pinned),
        (tab) => chrome.tabs.update(tab.id!, { pinned: true })
      );
    case ActionType.UNPIN:
      return applyToEach(
        tabs.filter((tab) => tab.pinned),
        (tab) => chrome.tabs.update(tab.id!, { pinned: false })
      );
    case ActionType.DISCARD:
      return applyToEach(
        tabs.filter((tab) => !tab.active && !tab.discarded),
        (tab) => chrome.tabs.discard(tab.id!)
      );
    case ActionType.MUTE:
      return applyToEach(
        tabs.filter((tab) => !tab.mutedInfo?.muted),
        (tab) => chrome.tabs.update(tab.id!, { muted: true })
      );
    case ActionType.HIGHLIGHT:
      return applyToEach(
        tabs.filter((tab) => !tab.highlighted),
        (tab) => chrome.tabs.update(tab.id!, { highlighted: true })
      );
    default:
      return 0;
  }
}
