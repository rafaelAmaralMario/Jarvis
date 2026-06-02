import { useState } from 'react';
import type { MarkdownNote } from '../../infrastructure/native';
import { validatePath, listMarkdownNotes, writeMarkdownNote } from '../../infrastructure/native';
import { searchContext as searchContextHelper } from '../../shared/helpers';
import type { MemoryEntry, ContextResult } from '../../shared/types';

export function useContextManager(
  workspacePath: string,
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [memoryInput, setMemoryInput] = useState('');
  const [contextQuery, setContextQuery] = useState('');
  const [contextResults, setContextResults] = useState<ContextResult[]>([]);

  async function loadObsidianNotes(activeVaultPath: string) {
    if (!activeVaultPath.trim()) {
      addLog('Informe o caminho do vault do Obsidian selecionado', 'warn');
      return;
    }

    const exists = await validatePath(activeVaultPath);
    if (!exists) {
      addLog('Vault do Obsidian nao encontrado', 'warn');
      return;
    }

    const markdownNotes = await listMarkdownNotes(activeVaultPath);
    setNotes(markdownNotes);
    addLog(`${markdownNotes.length} notas Markdown carregadas`, 'ok');
    addAudit('Context Engine', 'read-workspace', activeVaultPath, 'Notas indexadas');
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

    try {
      const path = await writeMarkdownNote(
        activeVaultPath,
        `${contextVaultKind === 'general' ? 'Jarvis Geral' : 'Jarvis Projeto'} ${new Date().toISOString().slice(0, 10)}`,
        memoryInput,
      );
      addLog(`Nota criada no Obsidian: ${path}`, 'ok');
      addAudit('Obsidian Writer', 'write-workspace', path, 'Nota Markdown criada');
      await loadObsidianNotes(activeVaultPath);
    } catch (error) {
      addLog(String(error), 'warn');
    }
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
