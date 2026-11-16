import type { Tab } from './browser';
export interface TabWithScreenshot extends Tab {
  screenshot?: string;
}

export interface TabsByWindow {
  [windowId: number]: TabWithScreenshot[];
}

export interface TabMoveInfo {
  sourceTabId: number;
  targetTabId: number;
  sourceWindowId: number;
  targetWindowId: number;
  sourceIndex: number;
  targetIndex: number;
}
