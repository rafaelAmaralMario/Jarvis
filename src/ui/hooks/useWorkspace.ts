import { useState, useCallback, useEffect } from 'react';
import type {
  WorkspaceEntry,
  GitFileStatus,
  GitBranch as GitBranchInfo,
  SearchResult,
} from '../../infrastructure/native';
import {
  listWorkspaceEntries,
  getGitStatus,
  listGitBranches,
  searchWorkspace,
} from '../../infrastructure/native';
import { formatError } from '../../shared/utils';
import type { ActionLog } from '../../shared/types';

export function useWorkspace(addLog: (message: string, status?: ActionLog['status']) => void) {
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

    try {
      setWorkspaceLoadError('');
      const workspaceEntries = await listWorkspaceEntries(path);
      setFiles(workspaceEntries);
      if (!options?.quiet) {
        addLog(`Workspace atualizado: ${path}`, 'ok');
      }
    } catch (error) {
      setFiles([]);
      const message = `Nao foi possivel listar arquivos: ${formatError(error)}`;
      setWorkspaceLoadError(message);
      addLog(message, 'warn');
    }
  }, [workspacePath, addLog]);

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
    const results = await searchWorkspace(workspacePath, query);
    setSearchResults(results);
    addLog(`${results.length} resultados encontrados`, 'ok');
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
