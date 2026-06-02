import { validatePath, listMarkdownNotes, writeMarkdownNote } from '../../infrastructure/native';
import { searchContext } from '../../shared/helpers';

export function createContextService(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
  async function loadObsidianNotes(activeVaultPath: string) {
    if (!activeVaultPath.trim()) {
      addLog('Configure um vault de destino nas configuracoes.', 'warn');
      return [];
    }

    const vaultExists = await validatePath(activeVaultPath);
    if (!vaultExists) {
      addLog(`Vault nao encontrado: ${activeVaultPath}`, 'warn');
      return [];
    }

    const notes = await listMarkdownNotes(activeVaultPath);
    addLog(`${notes.length} notas carregadas de ${activeVaultPath}`, 'ok');
    return notes;
  }

  async function writeMemoryToObsidian(activeVaultPath: string, content: string, title: string): Promise<void> {
    if (!activeVaultPath.trim()) {
      addLog('Configure um vault de destino antes de enviar.', 'warn');
      return;
    }

    const notePath = await writeMarkdownNote(activeVaultPath, title, content);
    addLog(`Contexto enviado ao vault: ${notePath}`, 'ok');
    addAudit('Contexto', 'write-workspace', activeVaultPath, 'Memoria enviada ao Obsidian');
  }

  return { loadObsidianNotes, writeMemoryToObsidian };
}

export type ContextService = ReturnType<typeof createContextService>;
