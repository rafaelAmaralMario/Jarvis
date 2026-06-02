import type { WorkspaceEntry, SearchResult } from '../../infrastructure/native';
import {
  listWorkspaceEntries,
  searchWorkspace,
} from '../../infrastructure/native';
import { formatError } from '../../shared/utils';

export function createWorkspaceService(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
) {
  async function refresh(path: string, options?: { quiet?: boolean }): Promise<WorkspaceEntry[]> {
    if (!path) {
      return [];
    }

    try {
      const entries = await listWorkspaceEntries(path);
      if (!options?.quiet) {
        addLog(`Workspace atualizado: ${path}`, 'ok');
      }
      return entries;
    } catch (error) {
      const message = `Nao foi possivel listar arquivos: ${formatError(error)}`;
      addLog(message, 'warn');
      throw error;
    }
  }

  async function runSearch(path: string, query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }
    const results = await searchWorkspace(path, query);
    addLog(`${results.length} resultados encontrados`, 'ok');
    return results;
  }

  return { refresh, runSearch };
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>;
