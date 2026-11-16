import type { Tab } from './browser';
export interface WorkspaceWindow {
  id: number;
  tabs: Tab[];
  focused: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  windows: WorkspaceWindow[];
  createdAt: number;
  lastAccessed: number;
  isActive: boolean;
}

export interface WorkspaceState {
  activeWorkspace: Workspace | null;
  inactiveWorkspaces: Workspace[];
}
