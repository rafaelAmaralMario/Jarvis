import { useState, useCallback, useEffect, useRef } from 'react';
import type { EditorTabInfo } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { EditorTabs } from './EditorTabs';
import { MonacoWrapper } from './MonacoWrapper';

interface EditorPanelProps {
  fileToOpen?: string;
}

interface TabState {
  info: EditorTabInfo;
  content: string;
  originalContent: string;
}

export function EditorPanel({ fileToOpen }: EditorPanelProps) {
  const bridge = useJarvis();
  const [tabs, setTabs] = useState<Map<string, TabState>>(new Map());
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeState = activeTab ? tabs.get(activeTab) : null;

  const openFile = useCallback(async (path: string) => {
    const currentTabs = tabsRef.current;
    if (currentTabs.has(path)) {
      setActiveTab(path);
      return;
    }

    const result = await bridge.editorOpenFile(path);
    if (!result) return;

    const tab: TabState = {
      info: result,
      content: result.content || '',
      originalContent: result.content || '',
    };

    setTabs(prev => {
      const next = new Map(prev);
      next.set(path, tab);
      return next;
    });
    setActiveTab(path);
  }, [bridge]);

  useEffect(() => {
    if (fileToOpen) {
      openFile(fileToOpen);
    }
  }, [fileToOpen, openFile]);

  const saveFile = useCallback(async (path: string) => {
    const currentTabs = tabsRef.current;
    const tab = currentTabs.get(path);
    if (!tab) return;

    const success = await bridge.editorSaveFile(path, tab.content);
    if (success) {
      setTabs(prev => {
        const next = new Map(prev);
        const t = next.get(path);
        if (t) {
          next.set(path, { ...t, info: { ...t.info, isDirty: false }, originalContent: t.content });
        }
        return next;
      });
    }
  }, [bridge]);

  const closeFile = useCallback((path: string, force = false) => {
    const currentTabs = tabsRef.current;
    const tab = currentTabs.get(path);
    if (!tab) return;

    if (tab.content !== tab.originalContent && !force) {
      setConfirmClose(path);
      return;
    }

    bridge.editorCloseFile(path);
    setTabs(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
    setConfirmClose(null);
  }, [bridge]);

  const handleContentChange = useCallback((path: string, content: string) => {
    setTabs(prev => {
      const next = new Map(prev);
      const t = next.get(path);
      if (t) {
        next.set(path, {
          ...t,
          content,
          info: { ...t.info, isDirty: content !== t.originalContent },
        });
      }
      return next;
    });
  }, []);

  const handleSaveCurrent = useCallback(() => {
    if (activeTab) saveFile(activeTab);
  }, [activeTab, saveFile]);

  const handleCloseCurrent = useCallback(() => {
    if (activeTab) closeFile(activeTab);
  }, [activeTab, closeFile]);

  const handleCloseConfirm = useCallback((action: 'save' | 'discard' | 'cancel') => {
    if (!confirmClose) return;
    if (action === 'save') {
      saveFile(confirmClose).then(() => closeFile(confirmClose, true));
    } else if (action === 'discard') {
      closeFile(confirmClose, true);
    } else {
      setConfirmClose(null);
    }
  }, [confirmClose, saveFile, closeFile]);

  const handleContextMenuAction = useCallback((action: string, path: string) => {
    setContextMenu(null);
    switch (action) {
      case 'save': saveFile(path); break;
      case 'close': closeFile(path); break;
      case 'save-all': {
        const keys = Array.from(tabsRef.current.keys());
        keys.forEach(p => saveFile(p));
        break;
      }
      case 'close-others': {
        const keys = Array.from(tabsRef.current.keys());
        keys.forEach(p => {
          if (p !== path) closeFile(p, true);
        });
        break;
      }
    }
  }, [saveFile, closeFile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const keys = Array.from(tabsRef.current.keys());
        if (keys.length < 2) return;
        const idx = keys.indexOf(activeTab || '');
        const nextIdx = e.shiftKey
          ? (idx - 1 + keys.length) % keys.length
          : (idx + 1) % keys.length;
        setActiveTab(keys[nextIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-3 py-1 border-b border-border bg-card">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
        >
          ☰
        </button>
        <span className="text-xs text-muted-foreground font-medium">EDITOR</span>
      </div>

      <EditorTabs
        tabs={Array.from(tabs.values()).map(t => ({
          ...t.info,
          name: t.info.path.split(/[/\\]/).pop() || t.info.path,
        }))}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onCloseTab={(path) => closeFile(path)}
        onContextMenu={(e, path) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, path });
        }}
      />

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleContextMenuAction('save', contextMenu.path)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
            >
              Salvar <span className="text-muted-foreground ml-2">Ctrl+S</span>
            </button>
            <button
              onClick={() => handleContextMenuAction('close', contextMenu.path)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
            >
              Fechar <span className="text-muted-foreground ml-2">Ctrl+W</span>
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => handleContextMenuAction('save-all', contextMenu.path)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
            >
              Salvar todos
            </button>
            <button
              onClick={() => handleContextMenuAction('close-others', contextMenu.path)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
            >
              Fechar outros
            </button>
          </div>
        </>
      )}

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium mb-2">Alterações não salvas</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Deseja salvar as alterações em "{confirmClose.split(/[/\\]/).pop()}" antes de fechar?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleCloseConfirm('cancel')}
                className="px-3 py-1.5 text-xs rounded bg-accent/30 hover:bg-accent/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCloseConfirm('discard')}
                className="px-3 py-1.5 text-xs rounded bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={() => handleCloseConfirm('save')}
                className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {activeState ? (
          <MonacoWrapper
            key={activeTab || ''}
            value={activeState.content}
            language={activeState.info.language}
            path={activeTab || ''}
            onChange={(val) => activeTab && handleContentChange(activeTab, val)}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
            onSave={handleSaveCurrent}
            onClose={handleCloseCurrent}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-4xl mb-3">&lt;/&gt;</p>
              <p className="text-sm">Selecione um arquivo na árvore</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                ou pressione Ctrl+P para busca rápida
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-1 border-t border-border text-[10px] text-muted-foreground bg-card">
        <span>
          {activeState && (
            <>{activeState.info.language}</>
          )}
        </span>
        <span>
          {activeState ? `Ln ${cursorPos.line}, Col ${cursorPos.col}` : ''}
        </span>
      </div>
    </div>
  );
}
