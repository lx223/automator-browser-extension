import { useState, useRef } from 'react';
import { TabWithScreenshot, TabMoveInfo } from '../types/tab';

export function useDragDrop() {
  const [draggedTab, setDraggedTab] = useState<TabWithScreenshot | null>(null);
  const [isCrossWindowMove, setIsCrossWindowMove] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragStart = (e: React.DragEvent, tab: TabWithScreenshot) => {
    setDraggedTab(tab);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', tab.id!.toString());
    
    // Create a custom drag image that follows the mouse
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'fixed';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.transform = 'rotate(5deg) scale(1.05)';
    dragImage.style.opacity = '0.9';
    dragImage.style.zIndex = '10000';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
    dragImage.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    dragImage.style.borderRadius = '12px';
    
    document.body.appendChild(dragImage);
    
    // Set the drag image with proper offset
    const rect = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    
    // Remove the drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setIsCrossWindowMove(false);
    dragCounterRef.current = 0;
    
    // Clean up all drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // Clean up all window-level drag feedback
    document.querySelectorAll('.drag-target').forEach(el => {
      el.classList.remove('drag-target');
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback for drop zones
    const target = e.currentTarget as HTMLElement;
    if (!target.classList.contains('drag-over')) {
      target.classList.add('drag-over');
    }
    
    // Add window-level feedback for cross-window drags
    const windowSection = target.closest('.window-section') as HTMLElement;
    if (windowSection && !windowSection.classList.contains('drag-target')) {
      windowSection.classList.add('drag-target');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Remove visual feedback when leaving drop zone
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    
    // Check if we're leaving the window section entirely
    const windowSection = target.closest('.window-section') as HTMLElement;
    if (windowSection && !windowSection.contains(e.relatedTarget as Node)) {
      windowSection.classList.remove('drag-target');
    }
  };

  const handleDrop = (
    e: React.DragEvent, 
    targetTab: TabWithScreenshot, 
    tabsByWindow: Record<number, TabWithScreenshot[]>,
    onTabMove: (moveInfo: TabMoveInfo) => void
  ) => {
    e.preventDefault();
    
    if (!draggedTab || draggedTab.id === targetTab.id) return;

    // Find source and target windows and indices
    let sourceWindowId: number | null = null;
    let targetWindowId: number | null = null;
    let sourceIndex = -1;
    let targetIndex = -1;

    // Find source tab
    Object.entries(tabsByWindow).forEach(([windowId, tabs]) => {
      const tabIndex = tabs.findIndex((tab: TabWithScreenshot) => tab.id === draggedTab.id);
      if (tabIndex !== -1) {
        sourceWindowId = parseInt(windowId);
        sourceIndex = tabIndex;
      }
    });

    // Find target tab
    Object.entries(tabsByWindow).forEach(([windowId, tabs]) => {
      const tabIndex = tabs.findIndex((tab: TabWithScreenshot) => tab.id === targetTab.id);
      if (tabIndex !== -1) {
        targetWindowId = parseInt(windowId);
        targetIndex = tabIndex;
      }
    });

    if (sourceWindowId !== null && targetWindowId !== null && sourceIndex !== -1 && targetIndex !== -1) {
      const isCrossWindow = sourceWindowId !== targetWindowId;
      
      console.log(`Moving tab ${draggedTab.id} from window ${sourceWindowId} to window ${targetWindowId}${isCrossWindow ? ' (cross-window)' : ''}`);
      
      // Set cross-window move state for UI feedback (only for extension page)
      const extensionUrl = chrome.runtime.getURL('tabs/index.html');
      const isExtensionPage = draggedTab.url === extensionUrl;
      setIsCrossWindowMove(isCrossWindow && isExtensionPage);
      
      // Call the parent's tab move handler
      onTabMove({
        sourceTabId: draggedTab.id!,
        targetTabId: targetTab.id!,
        sourceWindowId,
        targetWindowId,
        sourceIndex,
        targetIndex
      });
    }
  };

  return {
    draggedTab,
    isCrossWindowMove,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
