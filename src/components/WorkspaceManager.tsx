import React, { useState } from 'react';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { formatDate } from '../utils/dateUtils';

interface WorkspaceManagerProps {
  onWorkspaceChange?: () => void;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ onWorkspaceChange }) => {
  const {
    workspaceState,
    isLoading,
    createNewWorkspace,
    swapToWorkspace,
    deleteWorkspace,
    renameWorkspace
  } = useWorkspaces();

  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEditing = (workspace: any) => {
    setEditingWorkspaceId(workspace.id);
    setEditingName(workspace.name);
  };

  const saveEdit = async () => {
    if (!editingWorkspaceId || !editingName.trim()) return;

    try {
      await renameWorkspace(editingWorkspaceId, editingName.trim());
      setEditingWorkspaceId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error renaming workspace:', error);
    }
  };

  const cancelEdit = () => {
    setEditingWorkspaceId(null);
    setEditingName('');
  };

  const getTotalTabs = (workspace: any) => {
    return workspace.windows.reduce((total: number, window: any) => total + window.tabs.length, 0);
  };

  const handleCreateNewWorkspace = async () => {
    await createNewWorkspace();
    onWorkspaceChange?.();
  };

  const handleSwapToWorkspace = async (workspaceId: string) => {
    await swapToWorkspace(workspaceId);
    onWorkspaceChange?.();
  };

  return (
    <div className="workspace-manager">
      <div className="workspace-header">
        <h2>Workspaces</h2>
        <button 
          className="new-workspace-btn"
          onClick={handleCreateNewWorkspace}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : '+ New Workspace'}
        </button>
      </div>

      {/* Active Workspace */}
      {workspaceState.activeWorkspace && (
        <div className="workspace-section">
          <h3>Active Workspace</h3>
          <div className="workspace-card active">
            <div className="workspace-info">
              <div className="workspace-name">
                {editingWorkspaceId === workspaceState.activeWorkspace.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    onBlur={saveEdit}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => startEditing(workspaceState.activeWorkspace!)}>
                    {workspaceState.activeWorkspace.name}
                  </span>
                )}
              </div>
              <div className="workspace-stats">
                {workspaceState.activeWorkspace.windows.length} windows, {getTotalTabs(workspaceState.activeWorkspace)} tabs
              </div>
              <div className="workspace-date">
                Created: {formatDate(workspaceState.activeWorkspace.createdAt)}
              </div>
            </div>
            <div className="workspace-status">
              <span className="status-badge active">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Workspaces */}
      {workspaceState.inactiveWorkspaces.length > 0 && (
        <div className="workspace-section">
          <h3>Inactive Workspaces</h3>
          <div className="workspace-list">
            {workspaceState.inactiveWorkspaces.map((workspace) => (
              <div key={workspace.id} className="workspace-card inactive">
                <div className="workspace-info">
                  <div className="workspace-name">
                    {editingWorkspaceId === workspace.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                        autoFocus
                      />
                    ) : (
                      <span onClick={() => startEditing(workspace)}>
                        {workspace.name}
                      </span>
                    )}
                  </div>
                  <div className="workspace-stats">
                    {workspace.windows.length} windows, {getTotalTabs(workspace)} tabs
                  </div>
                  <div className="workspace-date">
                    Last accessed: {formatDate(workspace.lastAccessed)}
                  </div>
                </div>
                <div className="workspace-actions">
                  <button 
                    className="restore-btn"
                    onClick={() => handleSwapToWorkspace(workspace.id)}
                    disabled={isLoading}
                    title="Swap to this workspace"
                  >
                    🔄 Swap
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteWorkspace(workspace.id)}
                    title="Delete this workspace"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {workspaceState.inactiveWorkspaces.length === 0 && !workspaceState.activeWorkspace && (
        <div className="no-workspaces">
          <p>No workspaces found. Create your first workspace to get started!</p>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManager;