import { useState, useRef } from 'react';
import type { MarkdownNote } from '../../infrastructure/native';
import { searchContext as searchContextHelper } from '../../shared/helpers';
import type { MemoryEntry, ContextResult } from '../../shared/types';
import { createContextService, type ContextService } from '../../application/services/context';

export function useContextManager(
  workspacePath: string,
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
  const serviceRef = useRef<ContextService | null>(null);
  function getService() {
    if (!serviceRef.current) {
      serviceRef.current = createContextService(addLog, addAudit);
    }
    return serviceRef.current;
  }

  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [memoryInput, setMemoryInput] = useState('');
  const [contextQuery, setContextQuery] = useState('');
  const [contextResults, setContextResults] = useState<ContextResult[]>([]);

  async function loadObsidianNotes(activeVaultPath: string) {
    const markdownNotes = await getService().loadObsidianNotes(activeVaultPath);
    if (markdownNotes) {
      setNotes(markdownNotes);
    }
  }

  function addMemory() {
    const content = memoryInput.trim();
    if (!content) return;

    setMemoryEntries((current) => [
      { id: crypto.randomUUID(), content, createdAt: new Date().toLocaleString() },
      ...current,
    ]);
    setMemoryInput('');
    addAudit('Memory Engine', 'read-workspace', workspacePath, 'Memoria adicionada');
  }

  function runContextSearch() {
    const results = searchContextHelper(contextQuery, notes, memoryEntries);
    setContextResults(results);
    addLog(`${results.length} itens de contexto encontrados`, 'ok');
  }

  async function writeMemoryToObsidian(activeVaultPath: string, contextVaultKind: string) {
    if (!activeVaultPath.trim() || !memoryInput.trim()) {
      addLog('Informe o vault selecionado e o conteudo da nota', 'warn');
      return;
    }

    const title = `${contextVaultKind === 'general' ? 'Jarvis Geral' : 'Jarvis Projeto'} ${new Date().toISOString().slice(0, 10)}`;
    await getService().writeMemoryToObsidian(activeVaultPath, memoryInput, title);
    await loadObsidianNotes(activeVaultPath);
  }

  return {
    notes, setNotes,
    memoryEntries, setMemoryEntries,
    memoryInput, setMemoryInput,
    contextQuery, setContextQuery,
    contextResults, setContextResults,
    loadObsidianNotes,
    addMemory,
    runContextSearch,
    writeMemoryToObsidian,
  };
}
