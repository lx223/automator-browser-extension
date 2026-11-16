import { tabFromChrome } from '../utils/browserModels';
import type { Tab } from '../types/browser';
import { ExtensionMessage } from '../types/message';
import { MESSAGE_TYPES } from '../constants/messages';
import { WorkspaceService } from './workspaceService';
import { TabService } from './tabService';
import { ScreenshotService } from './screenshotService';
import { moveTab, updateTab } from '../utils/chromeUtils';

export class MessageService {
  private workspaceService = new WorkspaceService();
  private tabService = new TabService();
  private screenshotService = new ScreenshotService();

  async handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): Promise<boolean> {
    console.log('Message received:', message);
    
    switch (message.type) {
      case MESSAGE_TYPES.GET_TAB_INFO:
        this.handleGetTabInfo(sendResponse);
        return true;
        
      case MESSAGE_TYPES.GET_ALL_TABS:
        this.handleGetAllTabs(sendResponse);
        return true;
        
      case MESSAGE_TYPES.GET_TAB_GROUPS:
        this.handleGetTabGroups(sendResponse);
        return true;
        
      case MESSAGE_TYPES.GET_TAB_SCREENSHOT:
        this.handleGetTabScreenshot(message.tabId, sendResponse);
        return true;
        
      case MESSAGE_TYPES.CLEAR_SCREENSHOT_CACHE:
        this.handleClearScreenshotCache(sendResponse);
        return true;
        
      case MESSAGE_TYPES.REORDER_TABS:
        this.handleReorderTabs(message, sendResponse);
        return true;
        
      case MESSAGE_TYPES.EXECUTE_SCRIPT:
        this.handleExecuteScript(sender, sendResponse);
        return true;
        
      case MESSAGE_TYPES.PIN_TAB:
        this.handlePinTab(message.tabId, message.pinned, sendResponse);
        return true;
        
      case MESSAGE_TYPES.CREATE_TAB_GROUP:
        this.handleCreateTabGroup(message.windowId, message.tabIds, sendResponse);
        return true;
        
      case MESSAGE_TYPES.UPDATE_TAB_GROUP:
        this.handleUpdateTabGroup(message.tabIds, message.windowId, sendResponse);
        return true;
        
      case MESSAGE_TYPES.MOVE_GROUP_TO_WINDOW:
        this.handleMoveGroupToWindow(message.tabIds, message.newWindowId, sendResponse);
        return true;
        
      case MESSAGE_TYPES.GET_WORKSPACE_STATE:
        this.handleGetWorkspaceState(sendResponse);
        return true;
        
      case MESSAGE_TYPES.CREATE_NEW_WORKSPACE:
        this.handleCreateNewWorkspace(sendResponse);
        return true;
        
      case MESSAGE_TYPES.SWAP_TO_WORKSPACE:
        this.handleSwapToWorkspace(message.workspaceId, sendResponse);
        return true;
        
      case MESSAGE_TYPES.DELETE_WORKSPACE:
        this.handleDeleteWorkspace(message.workspaceId, sendResponse);
        return true;
        
      case MESSAGE_TYPES.RENAME_WORKSPACE:
        this.handleRenameWorkspace(message.workspaceId, message.newName, sendResponse);
        return true;
        
      default:
        console.log('Unknown message type:', message.type);
        sendResponse({ success: false });
        return true;
    }
  }

  private handleGetTabInfo(sendResponse: (response: any) => void): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url, title: tabs[0].title });
      }
    });
  }

  private handleGetAllTabs(sendResponse: (response: any) => void): void {
    chrome.tabs.query({}, (tabs) => {
      const tabsByWindow: Record<number, Tab[]> = {};
      
      tabs.forEach(tab => {
        if (tab.windowId) {
          if (!tabsByWindow[tab.windowId]) {
            tabsByWindow[tab.windowId] = [];
          }
          tabsByWindow[tab.windowId].push(tabFromChrome(tab));
        }
      });
      
      // Sort tabs by index
      Object.values(tabsByWindow).forEach(windowTabs => {
        windowTabs.sort((a, b) => (a.index || 0) - (b.index || 0));
      });
      
      sendResponse({ tabsByWindow });
    });
  }

  private async handleGetTabGroups(sendResponse: (response: any) => void): Promise<void> {
    try {
      const groups = await this.tabService.getAllTabGroups();
      sendResponse({ success: true, groups });
    } catch (error) {
      console.error('Error getting tab groups:', error);
      sendResponse({ success: false, error: 'Failed to get tab groups' });
    }
  }

  private handleGetTabScreenshot(tabId: number, sendResponse: (response: any) => void): void {
    this.screenshotService.captureTabScreenshot(tabId, sendResponse);
  }

  private async handleClearScreenshotCache(sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.screenshotService.clearScreenshotCache();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: 'Failed to clear cache' });
    }
  }

  private async handleReorderTabs(message: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { sourceTabId, sourceWindowId, targetWindowId, targetIndex } = message;
      
      if (sourceWindowId === targetWindowId) {
        // Same window - reorder within window
        await moveTab(sourceTabId, { index: targetIndex });
      } else {
        // Different windows - move tab between windows
        await moveTab(sourceTabId, { windowId: targetWindowId, index: targetIndex });
        
        // Only auto-focus if the moved tab is the extension page
        try {
          const movedTab = await chrome.tabs.get(sourceTabId);
          const extensionUrl = chrome.runtime.getURL('tabs/index.html');
          
          if (movedTab.url === extensionUrl) {
            console.log('Extension page moved across windows - focusing target window');
            await chrome.windows.update(targetWindowId, { focused: true });
            // Also activate the moved tab
            await updateTab(sourceTabId, { active: true });
          }
        } catch (focusError) {
          console.warn('Could not focus target window:', focusError);
          // Continue even if focusing fails
        }
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error reordering tabs:', error);
      sendResponse({ success: false, error: 'Failed to reorder tabs' });
    }
  }

  private handleExecuteScript(sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): void {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab?.id! },
      func: () => console.log('Script executed in content')
    });
    sendResponse({ success: true });
  }

  private async handlePinTab(tabId: number, pinned: boolean, sendResponse: (response: any) => void): Promise<void> {
    try {
      await updateTab(tabId, { pinned });
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error pinning/unpinning tab:', error);
      sendResponse({ success: false, error: 'Failed to pin/unpin tab' });
    }
  }

  private async handleCreateTabGroup(windowId: number, tabIds: number[], sendResponse: (response: any) => void): Promise<void> {
    try {
      const success = await this.tabService.createTabGroup(windowId, tabIds);
      sendResponse({ success });
    } catch (error) {
      console.error('Error creating tab group:', error);
      sendResponse({ success: false, error: 'Failed to create tab group' });
    }
  }

  private async handleUpdateTabGroup(tabIds: number[], windowId: number, sendResponse: (response: any) => void): Promise<void> {
    try {
      const success = await this.tabService.updateTabGroup(tabIds, windowId);
      sendResponse({ success });
    } catch (error) {
      console.error('Error updating tab group:', error);
      sendResponse({ success: false, error: 'Failed to update tab group' });
    }
  }

  private async handleMoveGroupToWindow(tabIds: number[], newWindowId: number, sendResponse: (response: any) => void): Promise<void> {
    try {
      const success = await this.tabService.moveGroupToWindow(tabIds, newWindowId);
      sendResponse({ success });
    } catch (error) {
      console.error('Error moving group to window:', error);
      sendResponse({ success: false, error: 'Failed to move group to window' });
    }
  }

  private async handleGetWorkspaceState(sendResponse: (response: any) => void): Promise<void> {
    try {
      const state = await this.workspaceService.getWorkspaceState();
      sendResponse({ success: true, state });
    } catch (error) {
      console.error('Error getting workspace state:', error);
      sendResponse({ success: false, error: 'Failed to get workspace state' });
    }
  }

  private async handleCreateNewWorkspace(sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.workspaceService.createNewWorkspace();
      const state = await this.workspaceService.getWorkspaceState();
      sendResponse({ success: true, state });
    } catch (error) {
      console.error('Error creating new workspace:', error);
      sendResponse({ success: false, error: 'Failed to create new workspace' });
    }
  }

  private async handleSwapToWorkspace(workspaceId: string, sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.workspaceService.swapToWorkspace(workspaceId);
      const state = await this.workspaceService.getWorkspaceState();
      sendResponse({ success: true, state });
    } catch (error) {
      console.error('Error swapping to workspace:', error);
      sendResponse({ success: false, error: 'Failed to swap to workspace' });
    }
  }

  private async handleDeleteWorkspace(workspaceId: string, sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.workspaceService.deleteWorkspace(workspaceId);
      const state = await this.workspaceService.getWorkspaceState();
      sendResponse({ success: true, state });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      sendResponse({ success: false, error: 'Failed to delete workspace' });
    }
  }

  private async handleRenameWorkspace(workspaceId: string, newName: string, sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.workspaceService.renameWorkspace(workspaceId, newName);
      const state = await this.workspaceService.getWorkspaceState();
      sendResponse({ success: true, state });
    } catch (error) {
      console.error('Error renaming workspace:', error);
      sendResponse({ success: false, error: 'Failed to rename workspace' });
    }
  }
}
