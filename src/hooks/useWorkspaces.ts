import { useState } from 'react';
import { WorkspaceState } from '../types/workspace';

export function useWorkspaces() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    activeWorkspace: null,
    inactiveWorkspaces: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaceState = async () => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_WORKSPACE_STATE' }, (response) => {
        if (response && response.success) {
          setWorkspaceState(response.state);
        }
      });
    } catch (error) {
      console.error('Error loading workspace state:', error);
    }
  };

  const createNewWorkspace = async () => {
    setIsLoading(true);
    try {
      chrome.runtime.sendMessage({ type: 'CREATE_NEW_WORKSPACE' }, (response) => {
        if (response && response.success) {
          setWorkspaceState(response.state);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error creating new workspace:', error);
      setIsLoading(false);
    }
  };

  const swapToWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      chrome.runtime.sendMessage({ 
        type: 'SWAP_TO_WORKSPACE', 
        workspaceId 
      }, (response) => {
        if (response && response.success) {
          setWorkspaceState(response.state);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error swapping to workspace:', error);
      setIsLoading(false);
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      chrome.runtime.sendMessage({ 
        type: 'DELETE_WORKSPACE', 
        workspaceId 
      }, (response) => {
        if (response && response.success) {
          setWorkspaceState(response.state);
        }
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  const renameWorkspace = async (workspaceId: string, newName: string) => {
    try {
      chrome.runtime.sendMessage({ 
        type: 'RENAME_WORKSPACE', 
        workspaceId,
        newName: newName.trim()
      }, (response) => {
        if (response && response.success) {
          setWorkspaceState(response.state);
        }
      });
    } catch (error) {
      console.error('Error renaming workspace:', error);
    }
  };

  return {
    workspaceState,
    isLoading,
    loadWorkspaceState,
    createNewWorkspace,
    swapToWorkspace,
    deleteWorkspace,
    renameWorkspace
  };
}
