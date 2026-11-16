import type { Tab } from '../types/browser';
import React, { useEffect } from 'react'
import TabTile from '../components/TabTile'
import { useTabs } from '../hooks/useTabs'
import { useScreenshots } from '../hooks/useScreenshots'
import { TabWithScreenshot } from '../types/tab'
import { getFaviconUrl } from '../utils/urlUtils'
import { MESSAGE_TYPES } from '../constants/messages'

const App: React.FC = () => {
  const { tabsByWindow, isLoading, loadAllTabs } = useTabs();
  const { screenshotsLoading } = useScreenshots();

  useEffect(() => {
    loadAllTabs()
  }, [])

  const handleTabClick = (tab: Tab) => {
    if (tab.id) {
      chrome.tabs.update(tab.id, { active: true })
      chrome.windows.update(tab.windowId!, { focused: true })
    }
  }

  const handleCloseTab = (tabId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    chrome.tabs.remove(tabId)
    // Refresh the tab list
    loadAllTabs()
  }

  const handlePinTab = (tabId: number, event: React.MouseEvent) => {
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
          loadAllTabs()
        } else {
          console.error('Failed to pin/unpin tab:', response?.error)
        }
      })
    }
  }

  // Dummy drag handlers for popup (not needed but required by TabTile)
  const dummyDragHandlers = {
    onDragStart: () => {},
    onDragEnd: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {}
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading tabs...</div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>All Tabs</h1>
        <p>Click on any tab to switch to it</p>
      </header>

      <main className="popup-main">
        {Object.keys(tabsByWindow).length === 0 ? (
          <div className="no-tabs">No tabs found</div>
        ) : (
          Object.entries(tabsByWindow).map(([windowId, tabs]) => (
            <section key={windowId} className="window-section">
              <h3 className="window-title">Window {windowId}</h3>
              <div className="tabs-grid">
                {tabs.map((tab: TabWithScreenshot) => (
                  <TabTile
                    key={tab.id}
                    tab={tab}
                    screenshotsLoading={screenshotsLoading}
                    onTabClick={handleTabClick}
                    onCloseTab={handleCloseTab}
                    onPinTab={handlePinTab}
                    getFaviconUrl={getFaviconUrl}
                    {...dummyDragHandlers}
                    isDragging={false}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}

export default App