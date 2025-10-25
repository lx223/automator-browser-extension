export interface BaseMessage {
  type: string;
}

export interface GetTabInfoMessage extends BaseMessage {
  type: 'GET_TAB_INFO';
}

export interface GetAllTabsMessage extends BaseMessage {
  type: 'GET_ALL_TABS';
}

export interface GetTabScreenshotMessage extends BaseMessage {
  type: 'GET_TAB_SCREENSHOT';
  tabId: number;
}

export interface ReorderTabsMessage extends BaseMessage {
  type: 'REORDER_TABS';
  sourceTabId: number;
  targetTabId: number;
  sourceWindowId: number;
  targetWindowId: number;
  sourceIndex: number;
  targetIndex: number;
}

export interface PinTabMessage extends BaseMessage {
  type: 'PIN_TAB';
  tabId: number;
  pinned: boolean;
}

export interface CreateTabGroupMessage extends BaseMessage {
  type: 'CREATE_TAB_GROUP';
  windowId: number;
  tabIds: number[];
}

export interface UpdateTabGroupMessage extends BaseMessage {
  type: 'UPDATE_TAB_GROUP';
  tabIds: number[];
  windowId: number;
}

export interface MoveGroupToWindowMessage extends BaseMessage {
  type: 'MOVE_GROUP_TO_WINDOW';
  tabIds: number[];
  newWindowId: number;
}

export interface GetWorkspaceStateMessage extends BaseMessage {
  type: 'GET_WORKSPACE_STATE';
}

export interface CreateNewWorkspaceMessage extends BaseMessage {
  type: 'CREATE_NEW_WORKSPACE';
}

export interface SwapToWorkspaceMessage extends BaseMessage {
  type: 'SWAP_TO_WORKSPACE';
  workspaceId: string;
}

export interface DeleteWorkspaceMessage extends BaseMessage {
  type: 'DELETE_WORKSPACE';
  workspaceId: string;
}

export interface RenameWorkspaceMessage extends BaseMessage {
  type: 'RENAME_WORKSPACE';
  workspaceId: string;
  newName: string;
}

export interface ClearScreenshotCacheMessage extends BaseMessage {
  type: 'CLEAR_SCREENSHOT_CACHE';
}

export interface RefreshTabsMessage extends BaseMessage {
  type: 'REFRESH_TABS';
}

export interface TabEventMessage extends BaseMessage {
  type: 'TAB_EVENT';
  eventType: string;
  data: any;
}

export interface GetTabGroupsMessage extends BaseMessage {
  type: 'GET_TAB_GROUPS';
}

export interface ExecuteScriptMessage extends BaseMessage {
  type: 'EXECUTE_SCRIPT';
}

export type ExtensionMessage = 
  | GetTabInfoMessage
  | GetAllTabsMessage
  | GetTabScreenshotMessage
  | ReorderTabsMessage
  | PinTabMessage
  | CreateTabGroupMessage
  | UpdateTabGroupMessage
  | MoveGroupToWindowMessage
  | GetWorkspaceStateMessage
  | CreateNewWorkspaceMessage
  | SwapToWorkspaceMessage
  | DeleteWorkspaceMessage
  | RenameWorkspaceMessage
  | ClearScreenshotCacheMessage
  | RefreshTabsMessage
  | TabEventMessage
  | GetTabGroupsMessage
  | ExecuteScriptMessage;
