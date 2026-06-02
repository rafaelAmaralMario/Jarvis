import { useState } from 'react';
import type { EditorTab } from '../../shared/types';
import { samePath } from '../../shared/utils';
import type { WorkspaceEntry } from '../../infrastructure/native';
import { writeTextFile } from '../../infrastructure/native';

export function useEditor(
  workspacePath: string,
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  options?: { initialTabs?: EditorTab[]; defaultTabPath?: string },
) {
  const [tabs, setTabs] = useState<EditorTab[]>(options?.initialTabs ?? []);
  const [activeTabPath, setActiveTabPath] = useState(options?.initialTabs?.[0]?.path ?? options?.defaultTabPath ?? '');

  const activeTab = tabs.find((tab) => samePath(tab.path, activeTabPath)) ?? tabs[0];
  const dirtyTabs = tabs.filter((tab) => tab.content !== tab.savedContent);

  function updateActiveTab(content: string) {
    setTabs((current) =>
      current.map((tab) => (samePath(tab.path, activeTab.path) ? { ...tab, content } : tab)),
    );
  }

  function closeTabByPath(path: string, fallbackPath?: string) {
    setTabs((current) => current.filter((item) => !samePath(item.path, path)));
    if (samePath(activeTabPath, path)) {
      setActiveTabPath(fallbackPath ?? '');
    }
  }

  function closeTab(tab: EditorTab, onCloseDirty: (tab: EditorTab) => void, fallbackPath?: string) {
    if (tab.content !== tab.savedContent) {
      onCloseDirty(tab);
      return;
    }
    closeTabByPath(tab.path, fallbackPath);
  }

  async function openFile(
    file: WorkspaceEntry,
    readTextFile: (workspacePath: string, path: string) => Promise<{ path: string; content: string }>,
    languageFromPath: (path: string) => string,
  ) {
    if (file.kind === 'directory') return;

    const existing = tabs.find((tab) => samePath(tab.path, file.path));
    if (existing) {
      setActiveTabPath(existing.path);
      return;
    }

    try {
      const result = await readTextFile(workspacePath, file.path);
      const existingByCanonicalPath = tabs.find((tab) => samePath(tab.path, result.path));
      if (existingByCanonicalPath) {
        setActiveTabPath(existingByCanonicalPath.path);
        return;
      }

      const tab: EditorTab = {
        path: result.path,
        name: file.name,
        content: result.content,
        savedContent: result.content,
        language: languageFromPath(result.path),
      };
      setTabs((current) => [...current, tab]);
      setActiveTabPath(tab.path);
      addLog(`Arquivo aberto: ${file.name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function saveActiveFile(
    onSaved: () => Promise<void>,
    denyList: string[],
  ) {
    if (denyList.includes(activeTab.path)) {
      addLog('Abra um arquivo do workspace antes de salvar', 'warn');
      return;
    }

    try {
      await writeTextFile(workspacePath, activeTab.path, activeTab.content);
      setTabs((current) =>
        current.map((tab) =>
          samePath(tab.path, activeTab.path) ? { ...tab, savedContent: tab.content } : tab,
        ),
      );
      await onSaved();
      addLog(`Arquivo salvo: ${activeTab.name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  return {
    tabs, setTabs,
    activeTabPath, setActiveTabPath,
    activeTab,
    dirtyTabs,
    updateActiveTab,
    closeTab,
    closeTabByPath,
    openFile,
    saveActiveFile,
  };
}
