import type { Tab, Group } from '../types/browser';
import { getAllTabs, getTabsForWindow, getAllTabGroups, getTabGroupsForWindow, moveTab } from '../utils/chromeUtils';

export class TabService {
  async getAllTabsWithGroups(): Promise<Tab[]> {
    try {
      return await getAllTabs();
    } catch (error) {
      console.error('Error getting tabs with groups:', error);
      return [];
    }
  }

  async getTabsForWindowWithGroups(windowId: number): Promise<Tab[]> {
    try {
      return await getTabsForWindow(windowId);
    } catch (error) {
      console.error('Error getting tabs for window with groups:', error);
      return [];
    }
  }

  async createTabGroup(windowId: number, tabIds: number[]): Promise<boolean> {
    try {
      // Since we can't create actual Chrome groups programmatically,
      // we'll just organize the tabs by moving them together
      if (tabIds.length > 0) {
        // Move all tabs to be adjacent
        for (let i = 0; i < tabIds.length; i++) {
          await moveTab(tabIds[i], { windowId, index: i });
        }
      }
      return true;
    } catch (error) {
      console.error('Error creating tab group:', error);
      return false;
    }
  }

  async updateTabGroup(tabIds: number[], windowId: number): Promise<boolean> {
    try {
      // Move tabs to be adjacent
      for (let i = 0; i < tabIds.length; i++) {
        await moveTab(tabIds[i], { windowId, index: i });
      }
      return true;
    } catch (error) {
      console.error('Error updating tab group:', error);
      return false;
    }
  }

  async moveGroupToWindow(tabIds: number[], newWindowId: number): Promise<boolean> {
    try {
      // Move all tabs to the new window
      for (const tabId of tabIds) {
        await moveTab(tabId, { windowId: newWindowId, index: -1 });
      }
      return true;
    } catch (error) {
      console.error('Error moving group to window:', error);
      return false;
    }
  }

  async getAllTabGroups(): Promise<Group[]> {
    try {
      return await getAllTabGroups();
    } catch (error) {
      console.error('Error getting tab groups:', error);
      return [];
    }
  }

  async getTabGroupsForWindow(windowId: number): Promise<Group[]> {
    try {
      return await getTabGroupsForWindow(windowId);
    } catch (error) {
      console.error('Error getting tab groups for window:', error);
      return [];
    }
  }
}
