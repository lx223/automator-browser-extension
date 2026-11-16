import type { Tab } from '../types/browser';
import React from 'react';
import { TabWithScreenshot } from '../types/tab';

interface TabTileProps {
  tab: TabWithScreenshot;
  screenshotsLoading: Set<number>;
  onTabClick: (tab: Tab) => void;
  onCloseTab: (tabId: number, event: React.MouseEvent) => void;
  onPinTab: (tabId: number, event: React.MouseEvent) => void;
  getFaviconUrl: (url: string) => string;
  onDragStart: (e: React.DragEvent, tab: TabWithScreenshot) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, tab: TabWithScreenshot) => void;
  isDragging: boolean;
}

const TabTile: React.FC<TabTileProps> = ({ 
  tab, 
  screenshotsLoading, 
  onTabClick, 
  onCloseTab, 
  onPinTab,
  getFaviconUrl,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging
}) => {
  return (
    <div
      className={`tab-tile ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, tab)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, tab)}
      onClick={() => onTabClick(tab)}
    >
      <div className="tab-screenshot">
        {screenshotsLoading.has(tab.id!) ? (
          <div className="screenshot-loading">Loading...</div>
        ) : tab.screenshot ? (
          <img 
            src={tab.screenshot} 
            alt={`Screenshot of ${tab.title}`}
            className="screenshot-image"
          />
        ) : (
          <div className="screenshot-placeholder">
            <img 
              src={getFaviconUrl(tab.url || '')} 
              alt="Favicon"
              className="favicon"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        {tab.pinned && (
          <div className="pin-indicator" title="Pinned tab">
            📌
          </div>
        )}
      </div>
      <div className="tab-info">
        <div className="tab-title" title={tab.title}>
          {tab.title || 'Untitled'}
        </div>
        <div className="tab-url" title={tab.url}>
          {tab.url ? new URL(tab.url).hostname : ''}
        </div>
      </div>
      <button 
        className="pin-tab-btn"
        onClick={(e) => onPinTab(tab.id!, e)}
        title={tab.pinned ? "Unpin tab" : "Pin tab"}
      >
        {tab.pinned ? "📌" : "📍"}
      </button>
      <button 
        className="close-tab-btn"
        onClick={(e) => onCloseTab(tab.id!, e)}
        title="Close tab"
      >
        ×
      </button>
    </div>
  );
};

export default TabTile;
