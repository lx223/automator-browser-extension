import type { Tab, Group } from '../types/browser';
import React, { useState, useEffect } from 'react'
import WorkspaceManager from '../components/WorkspaceManager'
import TabTile from '../components/TabTile'
import TabGroup from '../components/TabGroup'
import { useTabs } from '../hooks/useTabs'
import { useScreenshots } from '../hooks/useScreenshots'
import { useDragDrop } from '../hooks/useDragDrop'
import { TabWithScreenshot, TabMoveInfo } from '../types/tab'
import { getFaviconUrl } from '../utils/urlUtils'
import { MESSAGE_TYPES } from '../constants/messages'

const App: React.FC = () => {
  const {
    tabsByWindow,
    isLoading,
    loadAllTabs,
    updateTabInState,
    getUngroupedTabs,
    getTabsInGroup
  } = useTabs();

  const {
    screenshotsLoading,
    clearScreenshotCache
  } = useScreenshots();

  const {
    draggedTab,
    isCrossWindowMove,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragDrop();

  const [tabGroups, setTabGroups] = useState<Group[]>([])
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false)

  useEffect(() => {
    loadAllTabs()
    loadTabGroups()
    
    // Listen for tab events and refresh messages from background script
    const handleMessage = (message: any) => {
      if (message.type === MESSAGE_TYPES.REFRESH_TABS) {
        loadAllTabs()
        loadTabGroups()
      } else if (message.type === MESSAGE_TYPES.TAB_EVENT) {
        handleTabEvent(message.eventType, message.data)
      }
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  const handleTabEvent = (eventType: string, data: any) => {
    console.log('Tab event received:', eventType, data)
    
    switch (eventType) {
      case 'TAB_CREATED':
      case 'TAB_REMOVED':
      case 'TAB_ATTACHED':
      case 'TAB_DETACHED':
        // Reload all tabs for structural changes
        loadAllTabs()
        break
        
      case 'TAB_MOVED':
        // For tab moves, preserve screenshots to avoid unnecessary reloads
        loadAllTabs(true)
        break
        
      case 'TAB_UPDATED':
        // Update specific tab if it exists in our state
        if (data.tab) {
          updateTabInState(data.tab)
        }
        break
        
      case 'TAB_ACTIVATED':
        // Could update UI to show active tab, but not critical
        break
        
      case 'TAB_GROUP_CREATED':
      case 'TAB_GROUP_UPDATED':
      case 'TAB_GROUP_MOVED':
      case 'TAB_GROUP_REMOVED':
        // Refresh groups when any group event occurs
        loadTabGroups()
        break
        
      case 'TAB_GROUP_MEMBERSHIP_CHANGED':
        // Refresh both tabs and groups when tab group membership changes
        loadAllTabs(true) // Preserve screenshots
        loadTabGroups()
        break
        
      default:
        console.log('Unknown tab event:', eventType)
    }
  }

  const loadTabGroups = async () => {
    try {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAB_GROUPS }, (response) => {
        if (response && response.success && response.groups) {
          setTabGroups(response.groups);
        }
      });
    } catch (error) {
      console.error('Error loading tab groups:', error);
    }
  }

  const handleTabClick = (tab: Tab) => {
    if (tab.id) {
      chrome.tabs.update(tab.id, { active: true })
      chrome.windows.update(tab.windowId!, { focused: true })
    }
  }

  const closeTab = (tabId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    chrome.tabs.remove(tabId)
    // Refresh the tab list but preserve screenshots
    loadAllTabs(true)
  }

  const pinTab = (tabId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    // Find the tab to get its current pinned state
    let targetTab: TabWithScreenshot | null = null
    Object.values(tabsByWindow).forEach(tabs => {
      const tab = tabs.find((t: TabWithScreenshot) => t.id === tabId)
      if (tab) targetTab = tab
    })
    
    if (targetTab) {
      const currentPinned = (targetTab as Tab).pinned || false
      const newPinnedState = !currentPinned
      chrome.runtime.sendMessage({ 
        type: MESSAGE_TYPES.PIN_TAB, 
        tabId, 
        pinned: newPinnedState 
      }, (response) => {
        if (response && response.success) {
          console.log(`Successfully ${newPinnedState ? 'pinned' : 'unpinned'} tab ${tabId}`)
          // Refresh the tab list to reflect the change
          loadAllTabs(true)
        } else {
          console.error('Failed to pin/unpin tab:', response?.error)
        }
      })
    }
  }

  const handleTabMove = (moveInfo: TabMoveInfo) => {
    const { sourceTabId, targetTabId, sourceWindowId, targetWindowId, sourceIndex, targetIndex } = moveInfo;
    const isCrossWindow = sourceWindowId !== targetWindowId;
    
    console.log(`Moving tab ${sourceTabId} from window ${sourceWindowId} to window ${targetWindowId}${isCrossWindow ? ' (cross-window)' : ''}`);

    // Send message to background script to reorder tabs in browser
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.REORDER_TABS,
      sourceTabId,
      targetTabId,
      sourceWindowId,
      targetWindowId,
      sourceIndex,
      targetIndex
    }, (response) => {
      if (response && response.success) {
        console.log(`Successfully moved tab ${sourceTabId}${isCrossWindow ? ' across windows' : ' within window'}`)
        
        if (isCrossWindow) {
          // Show a brief notification for cross-window moves of extension page
          console.log(`Extension page moved to window ${targetWindowId} - window will be focused automatically`)
        }
      } else {
        console.error('Failed to move tab:', response?.error)
        // Optionally revert the local state change
      }
    })
  }

  const handleWorkspaceChange = () => {
    // Reload tabs and groups when workspace changes
    loadAllTabs()
    loadTabGroups()
  };

  if (isLoading) {
    return (
      <div className="tabs-container">
        <div className="loading">Loading tabs...</div>
      </div>
    )
  }

  return (
    <div className="tabs-container">
      <header className="tabs-header">
        <h1>Tab Manager</h1>
        <p>Manage all your open tabs across windows - Drag and drop to reorder and group</p>
        {isCrossWindowMove && (
          <div className="cross-window-indicator">
            <span className="indicator-icon">🔄</span>
            Moving extension page across windows - target window will be focused automatically
          </div>
        )}
        <div className="header-buttons">
          <button 
            className={`workspace-toggle ${showWorkspaceManager ? 'active' : ''}`}
            onClick={() => setShowWorkspaceManager(!showWorkspaceManager)}
          >
            {showWorkspaceManager ? '📁 Hide Workspaces' : '📁 Show Workspaces'}
          </button>
          <button onClick={clearScreenshotCache} className="clear-cache-btn">
            Clear Cache
          </button>
        </div>
      </header>

      <main className="tabs-main">
        {showWorkspaceManager && (
          <WorkspaceManager onWorkspaceChange={handleWorkspaceChange} />
        )}
        
        {Object.keys(tabsByWindow).length === 0 ? (
          <div className="no-tabs">No tabs found</div>
        ) : (
          Object.entries(tabsByWindow).map(([windowId, tabs]) => {
            const windowIdNum = parseInt(windowId);
            const windowGroups = tabGroups.filter(group => group.windowId === windowIdNum);
            const ungroupedTabs = getUngroupedTabs(windowIdNum);
            
            return (
              <section key={windowId} className="window-section">
                <h2 className="window-title">Window {windowId} ({tabs.length} tabs)</h2>
                
                {/* Tab Groups */}
                {windowGroups.map((group) => {
                  const groupTabs = getTabsInGroup(group);
                  return (
                    <TabGroup
                      key={group.id}
                      group={group}
                      groupTabs={groupTabs}
                      screenshotsLoading={screenshotsLoading}
                      onTabClick={handleTabClick}
                      onCloseTab={closeTab}
                      onPinTab={pinTab}
                      getFaviconUrl={getFaviconUrl}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e, tab) => handleDrop(e, tab, tabsByWindow, handleTabMove)}
                      draggedTab={draggedTab}
                    />
                  );
                })}
                
                {/* Ungrouped Tabs - Always show this section */}
                <div className="ungrouped-tabs">
                  <h3 className="ungrouped-title">Ungrouped Tabs ({ungroupedTabs.length})</h3>
                  <div className="tabs-grid">
                    {ungroupedTabs.map((tab: TabWithScreenshot) => (
                      <TabTile
                        key={tab.id}
                        tab={tab}
                        screenshotsLoading={screenshotsLoading}
                        onTabClick={handleTabClick}
                        onCloseTab={closeTab}
                        onPinTab={pinTab}
                        getFaviconUrl={getFaviconUrl}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, tab, tabsByWindow, handleTabMove)}
                        isDragging={draggedTab?.id === tab.id}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  )
}

export default App