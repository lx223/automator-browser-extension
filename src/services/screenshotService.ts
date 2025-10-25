import { ScreenshotCache, ScreenshotResponse } from '../types/settings';
import { CAPTURE_DELAY, MAX_CACHE_AGE, SCREENSHOT_WAIT_TIME } from '../constants/config';
import { createEnhancedPlaceholderScreenshot } from '../utils/screenshotUtils';
import { getTab, updateTab, captureVisibleTab, getWindow } from '../utils/chromeUtils';

export class ScreenshotService {
  private screenshotQueue: Array<{tabId: number, sendResponse: (response: any) => void}> = [];
  private isProcessingQueue = false;

  async getCachedScreenshot(tabId: number): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get(`screenshot_${tabId}`);
      const cached = result[`screenshot_${tabId}`] as ScreenshotCache;
      
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < MAX_CACHE_AGE) {
          return cached.dataUrl;
        } else {
          await chrome.storage.local.remove(`screenshot_${tabId}`);
        }
      }
    } catch (error) {
      console.error('Error getting cached screenshot:', error);
    }
    return null;
  }

  async cacheScreenshot(tabId: number, dataUrl: string): Promise<void> {
    try {
      await chrome.storage.local.set({
        [`screenshot_${tabId}`]: {
          dataUrl,
          timestamp: Date.now()
        } as ScreenshotCache
      });
    } catch (error) {
      console.error('Error caching screenshot:', error);
    }
  }

  async captureTabScreenshotInternal(tabId: number): Promise<ScreenshotResponse> {
    try {
      const tab = await getTab(tabId);
      if (!tab?.windowId) {
        return { success: false, error: 'Tab not found' };
      }

      // Check if tab is accessible for screenshot
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('moz-extension://')) {
        console.log(`Skipping screenshot for restricted URL: ${tab.url}`);
        return createEnhancedPlaceholderScreenshot(tab);
      }

      // Check if tab is in a visible window
      const window = await getWindow(tab.windowId);
      if (window.state === 'minimized') {
        console.log(`Skipping screenshot for minimized window: ${tab.windowId}`);
        return createEnhancedPlaceholderScreenshot(tab);
      }

      const activeTabs = await chrome.tabs.query({ active: true, windowId: tab.windowId });
      const originalActiveTab = activeTabs[0];

      try {
        // Temporarily activate tab and capture
        await updateTab(tabId, { active: true });
        await new Promise(resolve => setTimeout(resolve, SCREENSHOT_WAIT_TIME));
        
        const dataUrl = await captureVisibleTab(tab.windowId, { format: 'png' });
        
        // Restore original active tab
        if (originalActiveTab?.id !== tabId) {
          await updateTab(originalActiveTab.id!, { active: true });
        }
        
        return { success: true, dataUrl };
      } catch (captureError) {
        console.error('Error capturing screenshot:', captureError);
        
        // Restore original tab on error
        if (originalActiveTab?.id !== tabId) {
          try {
            await updateTab(originalActiveTab.id!, { active: true });
          } catch (restoreError) {
            console.error('Error restoring original tab:', restoreError);
          }
        }
        
        return createEnhancedPlaceholderScreenshot(tab);
      }
    } catch (error) {
      console.error('Error in captureTabScreenshotInternal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async processScreenshotQueue(): Promise<void> {
    if (this.isProcessingQueue || this.screenshotQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    console.log(`Processing screenshot queue with ${this.screenshotQueue.length} items`);
    
    while (this.screenshotQueue.length > 0) {
      const { tabId, sendResponse } = this.screenshotQueue.shift()!;
      
      try {
        console.log(`Processing screenshot for tab ${tabId}`);
        
        // Check cache first
        const cached = await this.getCachedScreenshot(tabId);
        if (cached) {
          console.log(`Using cached screenshot for tab ${tabId}`);
          sendResponse({ success: true, dataUrl: cached });
          continue;
        }
        
        // Capture new screenshot
        console.log(`Capturing new screenshot for tab ${tabId}`);
        const result = await this.captureTabScreenshotInternal(tabId);
        if (result.success && result.dataUrl) {
          console.log(`Successfully captured screenshot for tab ${tabId}`);
          await this.cacheScreenshot(tabId, result.dataUrl);
        } else {
          console.warn(`Failed to capture screenshot for tab ${tabId}:`, result.error);
        }
        sendResponse(result);
      } catch (error) {
        console.error('Error processing screenshot queue:', error);
        sendResponse({ success: false, error: 'Screenshot capture failed' });
      }
      
      // Rate limiting
      if (this.screenshotQueue.length > 0) {
        console.log(`Waiting ${CAPTURE_DELAY}ms before next capture`);
        await new Promise(resolve => setTimeout(resolve, CAPTURE_DELAY));
      }
    }
    
    this.isProcessingQueue = false;
    console.log('Screenshot queue processing complete');
  }

  captureTabScreenshot(tabId: number, sendResponse: (response: any) => void): void {
    this.screenshotQueue.push({ tabId, sendResponse });
    this.processScreenshotQueue();
  }

  async clearScreenshotCache(): Promise<void> {
    try {
      const keys = Object.keys(await chrome.storage.local.get());
      const screenshotKeys = keys.filter(key => key.startsWith('screenshot_'));
      if (screenshotKeys.length > 0) {
        await chrome.storage.local.remove(screenshotKeys);
      }
    } catch (error) {
      console.error('Error clearing screenshot cache:', error);
      throw error;
    }
  }
}
