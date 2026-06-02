import { useState, useCallback, useRef } from 'react';
import type { WorkspaceEntry, SearchResult } from '../../infrastructure/native';
import { createWorkspaceService, type WorkspaceService } from '../../application/services/workspace';
import type { ActionLog } from '../../shared/types';

export function useWorkspace(addLog: (message: string, status?: ActionLog['status']) => void) {
  const serviceRef = useRef<WorkspaceService | null>(null);
  function getService() {
    if (!serviceRef.current) {
      serviceRef.current = createWorkspaceService(addLog);
    }
    return serviceRef.current;
  }

  const [workspacePath, setWorkspacePath] = useState('');
  const [files, setFiles] = useState<WorkspaceEntry[]>([]);
  const [workspaceLoadError, setWorkspaceLoadError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<WorkspaceEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const refreshWorkspace = useCallback(async (path = workspacePath, options?: { quiet?: boolean }) => {
    if (!path) {
      setFiles([]);
      setWorkspaceLoadError('Nenhuma pasta de projeto selecionada.');
      return;
    }

    setWorkspaceLoadError('');
    try {
      const entries = await getService().refresh(path, options);
      setFiles(entries);
    } catch {
      setFiles([]);
      setWorkspaceLoadError(`Nao foi possivel listar arquivos em: ${path}`);
    }
  }, [workspacePath]);

  async function initializeWorkspace(
    settingsWorkspacePath: string,
    getDefaultWorkspacePathFn: () => Promise<string>,
    onPathChange: (path: string) => void,
  ) {
    const path = settingsWorkspacePath || (await getDefaultWorkspacePathFn());
    setWorkspacePath(path);
    onPathChange(path);
    await refreshWorkspace(path);
  }

  function toggleFolder(path: string) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function ensureFolderExpanded(path: string) {
    if (!path || path === workspacePath) return;
    setExpandedFolders((current) => new Set(current).add(path));
  }

  async function runSearch(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await getService().runSearch(workspacePath, query);
    setSearchResults(results);
  }

  return {
    workspacePath, setWorkspacePath,
    files, setFiles,
    workspaceLoadError, setWorkspaceLoadError,
    expandedFolders, setExpandedFolders,
    selectedEntry, setSelectedEntry,
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    initializeWorkspace,
    refreshWorkspace,
    toggleFolder,
    ensureFolderExpanded,
    runSearch,
  };
}
