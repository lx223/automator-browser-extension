import { Workspace, WorkspaceState } from '../types/workspace';
import { getAllWindows, createWindow, removeWindow, createTab } from '../utils/chromeUtils';

export class WorkspaceService {
  async getWorkspaceState(): Promise<WorkspaceState> {
    try {
      const result = await chrome.storage.local.get('workspaceState');
      return result.workspaceState || { activeWorkspace: null, inactiveWorkspaces: [] };
    } catch (error) {
      console.error('Error getting workspace state:', error);
      return { activeWorkspace: null, inactiveWorkspaces: [] };
    }
  }

  async saveWorkspaceState(state: WorkspaceState): Promise<void> {
    try {
      await chrome.storage.local.set({ workspaceState: state });
    } catch (error) {
      console.error('Error saving workspace state:', error);
    }
  }

  async saveCurrentSessionAsWorkspace(): Promise<Workspace> {
    try {
      const allWindows = await getAllWindows();
      const workspaceId = `workspace_${Date.now()}`;
      
      const workspace: Workspace = {
        id: workspaceId,
        name: `Workspace ${new Date().toLocaleDateString()}`,
        windows: allWindows.map(window => ({
          id: window.id!,
          tabs: window.tabs || [],
          focused: window.focused || false
        })),
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        isActive: false
      };
      
      return workspace;
    } catch (error) {
      console.error('Error saving current session as workspace:', error);
      throw error;
    }
  }

  async createNewWorkspace(): Promise<void> {
    try {
      const state = await this.getWorkspaceState();
      
      // Save current session as inactive workspace
      const currentSession = await this.saveCurrentSessionAsWorkspace();
      state.inactiveWorkspaces.push(currentSession);
      
      // Close all windows and tabs
      const allWindows = await getAllWindows();
      for (const window of allWindows) {
        await removeWindow(window.id!);
      }
      
      // Create new clean workspace with just extension tab
      const extensionUrl = chrome.runtime.getURL('tabs/index.html');
      const extensionTab = await createTab({ url: extensionUrl });
      const extensionWindow = await chrome.windows.get(extensionTab.windowId!);
      
      const newActiveWorkspace: Workspace = {
        id: `workspace_${Date.now()}`,
        name: `Workspace ${new Date().toLocaleDateString()}`,
        windows: [{
          id: extensionWindow.id!,
          tabs: extensionWindow.tabs || [],
          focused: true
        }],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        isActive: true
      };
      
      state.activeWorkspace = newActiveWorkspace;
      await this.saveWorkspaceState(state);
    } catch (error) {
      console.error('Error creating new workspace:', error);
      throw error;
    }
  }

  async swapToWorkspace(workspaceId: string): Promise<void> {
    try {
      const state = await this.getWorkspaceState();
      const workspaceToRestore = state.inactiveWorkspaces.find(w => w.id === workspaceId);
      
      if (!workspaceToRestore) {
        throw new Error('Workspace not found');
      }
      
      // Save current session as inactive workspace
      const currentSession = await this.saveCurrentSessionAsWorkspace();
      state.inactiveWorkspaces.push(currentSession);
      
      // Close all current windows and tabs
      const allWindows = await getAllWindows();
      for (const window of allWindows) {
        await removeWindow(window.id!);
      }
      
      // Restore windows from the target workspace
      for (const windowData of workspaceToRestore.windows) {
        if (windowData.tabs.length > 0) {
          // Create window with first tab
          const firstTab = windowData.tabs[0];
          const newWindow = await createWindow({
            url: firstTab.url,
            focused: windowData.focused
          });
          
          // Add remaining tabs to the window
          for (let i = 1; i < windowData.tabs.length; i++) {
            const tab = windowData.tabs[i];
            await createTab({
              windowId: newWindow.id,
              url: tab.url,
              active: false
            });
          }
        }
      }
      
      // Update workspace state
      workspaceToRestore.isActive = true;
      workspaceToRestore.lastAccessed = Date.now();
      
      // Remove from inactive and set as active
      state.inactiveWorkspaces = state.inactiveWorkspaces.filter(w => w.id !== workspaceId);
      state.activeWorkspace = workspaceToRestore;
      
      await this.saveWorkspaceState(state);
    } catch (error) {
      console.error('Error swapping to workspace:', error);
      throw error;
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      const state = await this.getWorkspaceState();
      state.inactiveWorkspaces = state.inactiveWorkspaces.filter(w => w.id !== workspaceId);
      await this.saveWorkspaceState(state);
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  async renameWorkspace(workspaceId: string, newName: string): Promise<void> {
    try {
      const state = await this.getWorkspaceState();
      
      if (state.activeWorkspace && state.activeWorkspace.id === workspaceId) {
        state.activeWorkspace.name = newName;
      } else {
        const workspace = state.inactiveWorkspaces.find(w => w.id === workspaceId);
        if (workspace) {
          workspace.name = newName;
        }
      }
      
      await this.saveWorkspaceState(state);
    } catch (error) {
      console.error('Error renaming workspace:', error);
      throw error;
    }
  }
}
