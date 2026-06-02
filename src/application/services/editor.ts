import { writeTextFile } from '../../infrastructure/native';
import { samePath } from '../../shared/utils';

export function createEditorService(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
) {
  async function saveFile(
    workspacePath: string,
    filePath: string,
    content: string,
    denyList: string[],
  ): Promise<void> {
    if (denyList.some((denied) => samePath(filePath, denied))) {
      addLog('Nao e possivel salvar este tipo de arquivo.', 'warn');
      return;
    }

    await writeTextFile(workspacePath, filePath, content);
    addLog(`Arquivo salvo: ${filePath}`, 'ok');
  }

  return { saveFile };
}

export type EditorService = ReturnType<typeof createEditorService>;
