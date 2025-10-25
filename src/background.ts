// Background script for the browser extension
console.log('Background script loaded');

import { MessageService } from './services/messageService';
import { MESSAGE_TYPES } from './constants/messages';

// Initialize services
const messageService = new MessageService();

// ============================================================================
// EXTENSION LIFECYCLE
// ============================================================================

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details);
  chrome.storage.sync.set({
    extensionEnabled: true,
    theme: 'light'
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener(async () => {
  const extensionUrl = chrome.runtime.getURL('tabs/index.html');
  const existingTabs = await chrome.tabs.query({ url: extensionUrl });
  
  if (existingTabs.length > 0) {
    const tab = existingTabs[0];
    chrome.tabs.update(tab.id!, { active: true });
    chrome.windows.update(tab.windowId!, { focused: true });
    chrome.tabs.sendMessage(tab.id!, { type: MESSAGE_TYPES.REFRESH_TABS });
  } else {
    chrome.tabs.create({ url: extensionUrl });
  }
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return messageService.handleMessage(message, sender, sendResponse);
});

// ============================================================================
// TAB EVENT HANDLING
// ============================================================================

// Tab event listeners for real-time updates
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_CREATED', data: { tab } });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('Tab removed:', tabId);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_REMOVED', data: { tabId } });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_UPDATED', data: { tabId, changeInfo, tab } });
  }
  
  // Check for group membership changes
  if (changeInfo.groupId !== undefined) {
    console.log('Tab group membership changed:', tabId, 'oldGroupId:', changeInfo.groupId, 'newGroupId:', tab.groupId);
    notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { 
      eventType: 'TAB_GROUP_MEMBERSHIP_CHANGED', 
      data: { 
      tabId, 
      oldGroupId: changeInfo.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE ? null : changeInfo.groupId,
      newGroupId: tab.groupId || null,
      tab 
      } 
    });
  }
});

chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
  console.log('Tab moved:', tabId);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_MOVED', data: { tabId, moveInfo } });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_ACTIVATED', data: { activeInfo } });
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  console.log('Tab attached:', tabId);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_ATTACHED', data: { tabId, attachInfo } });
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  console.log('Tab detached:', tabId);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_DETACHED', data: { tabId, detachInfo } });
});

// Tab Group Event Listeners
chrome.tabGroups.onCreated.addListener((group) => {
  console.log('Tab group created:', group);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_GROUP_CREATED', data: { group } });
});

chrome.tabGroups.onUpdated.addListener((group) => {
  console.log('Tab group updated:', group);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_GROUP_UPDATED', data: { group } });
});

chrome.tabGroups.onMoved.addListener((group) => {
  console.log('Tab group moved:', group);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_GROUP_MOVED', data: { group } });
});

chrome.tabGroups.onRemoved.addListener((group) => {
  console.log('Tab group removed:', group);
  notifyTabsPage(MESSAGE_TYPES.TAB_EVENT, { eventType: 'TAB_GROUP_REMOVED', data: { group } });
});

// Notify extension tabs page of changes
function notifyTabsPage(eventType: string, data: any) {
  chrome.tabs.query({ url: chrome.runtime.getURL('tabs/index.html') }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { 
          type: MESSAGE_TYPES.TAB_EVENT, 
          eventType, 
          data 
        }).catch(() => {
          // Ignore errors if tab is not ready
        });
      }
    });
  });
}