import { useState } from 'react';
import { TabWithScreenshot, TabsByWindow } from '../types/tab';
import { SCREENSHOT_DELAY } from '../constants/config';

export function useScreenshots() {
  const [screenshotsLoading, setScreenshotsLoading] = useState<Set<number>>(new Set());

  const loadTabScreenshot = (tabId: number) => {
    console.log(`Requesting screenshot for tab ${tabId}`);
    setScreenshotsLoading(prev => new Set(prev).add(tabId));
    
    chrome.runtime.sendMessage({ 
      type: 'GET_TAB_SCREENSHOT', 
      tabId 
    }, (response) => {
      setScreenshotsLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
      
      if (response && response.success && response.dataUrl) {
        console.log(`Successfully received screenshot for tab ${tabId}`);
        // The parent component should handle updating the tabs state
        return response.dataUrl;
      } else {
        console.warn(`Failed to capture screenshot for tab ${tabId}:`, response?.error);
        // Check if it's a Chrome runtime error
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
        }
        return null;
      }
    });
  };

  const loadScreenshotsForAllTabs = (tabsByWindow: TabsByWindow) => {
    // Only load screenshots for tabs that don't already have them
    let delay = 0;
    Object.values(tabsByWindow).forEach(tabs => {
      tabs.forEach((tab: TabWithScreenshot) => {
        if (tab.id && !tab.screenshot && !screenshotsLoading.has(tab.id)) {
          setTimeout(() => {
            loadTabScreenshot(tab.id!);
          }, delay);
          delay += SCREENSHOT_DELAY;
        }
      });
    });
  };

  const clearScreenshotCache = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_SCREENSHOT_CACHE' }, (response) => {
      if (response && response.success) {
        console.log('Screenshot cache cleared');
        return true;
      }
      return false;
    });
  };

  return {
    screenshotsLoading,
    loadTabScreenshot,
    loadScreenshotsForAllTabs,
    clearScreenshotCache
  };
}
