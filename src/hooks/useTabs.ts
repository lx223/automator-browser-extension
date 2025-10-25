import { useState } from 'react';
import { TabsByWindow, TabWithScreenshot } from '../types/tab';

export function useTabs() {
  const [tabsByWindow, setTabsByWindow] = useState<TabsByWindow>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAllTabs = async (preserveScreenshots = false) => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_ALL_TABS' }, (response) => {
        if (response && response.tabsByWindow) {
          if (preserveScreenshots) {
            // Preserve existing screenshots when reordering
            setTabsByWindow(prev => {
              const newTabsByWindow = { ...response.tabsByWindow };
              Object.keys(newTabsByWindow).forEach(windowId => {
                const windowIdNum = parseInt(windowId);
                if (prev[windowIdNum]) {
                  // Preserve screenshots from previous state
                  newTabsByWindow[windowIdNum] = newTabsByWindow[windowIdNum].map((newTab: TabWithScreenshot) => {
                    const existingTab = prev[windowIdNum].find(existing => existing.id === newTab.id);
                    return existingTab ? { ...newTab, screenshot: existingTab.screenshot } : newTab;
                  });
                }
              });
              return newTabsByWindow;
            });
          } else {
            setTabsByWindow(response.tabsByWindow);
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Error loading tabs:', error);
      setIsLoading(false);
    }
  };

  const updateTabInState = (updatedTab: chrome.tabs.Tab) => {
    setTabsByWindow(prev => {
      const newTabsByWindow = { ...prev };
      Object.keys(newTabsByWindow).forEach(windowId => {
        newTabsByWindow[parseInt(windowId)] = newTabsByWindow[parseInt(windowId)].map(tab => 
          tab.id === updatedTab.id ? { ...tab, ...updatedTab } : tab
        );
      });
      return newTabsByWindow;
    });
  };

  const getTabsForWindow = (windowId: number): TabWithScreenshot[] => {
    return tabsByWindow[windowId] || [];
  };

  const getUngroupedTabs = (windowId: number): TabWithScreenshot[] => {
    const windowTabs = getTabsForWindow(windowId);
    return windowTabs.filter(tab => 
      !tab.groupId || tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE
    );
  };

  const getTabsInGroup = (group: chrome.tabGroups.TabGroup): TabWithScreenshot[] => {
    const windowTabs = getTabsForWindow(group.windowId);
    return windowTabs.filter(tab => 
      tab.groupId === group.id && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
    );
  };

  return {
    tabsByWindow,
    isLoading,
    loadAllTabs,
    updateTabInState,
    getTabsForWindow,
    getUngroupedTabs,
    getTabsInGroup
  };
}
