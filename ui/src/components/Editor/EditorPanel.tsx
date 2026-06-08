import { useState, useCallback, useEffect, useRef } from 'react';
import type { EditorTabInfo } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { EditorTabs } from './EditorTabs';
import { MonacoWrapper } from './MonacoWrapper';
import { QuickOpen } from './QuickOpen';
import { CommandPalette } from './CommandPalette';
import { MarkdownPreview } from './MarkdownPreview';
import { Breadcrumb } from './Breadcrumb';
import { useAutoSave } from '@/hooks/useAutoSave';
import { EditorSettingsPanel } from './EditorSettingsPanel';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { ContextMenuItem } from '@/components/ui/ContextMenu';

interface EditorPanelProps {
  fileToOpen?: string;
}

interface TabState {
  info: EditorTabInfo;
  content: string;
  originalContent: string;
}

type SplitMode = 'single' | 'left' | 'right' | 'both';

export function EditorPanel({ fileToOpen }: EditorPanelProps) {
  const bridge = useJarvis();
  const [tabs, setTabs] = useState<Map<string, TabState>>(new Map());
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [quickOpenOpen, setQuickOpenOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [repoPath, setRepoPath] = useState('');

  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [rightTab, setRightTab] = useState<string | null>(null);
  const [rightCursorPos, setRightCursorPos] = useState({ line: 1, col: 1 });

  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 4,
    wordWrap: 'off',
    theme: 'vs-dark',
    minimap: true,
    lineNumbers: 'on',
    autoSave: true,
    autoSaveDelay: 2000,
    formatOnSave: false,
    formatOnSaveMode: 'monaco',
  });

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeState = activeTab ? tabs.get(activeTab) : null;
  const rightState = rightTab ? tabs.get(rightTab) : null;
  const isSplit = splitMode === 'both';

  const loadSettings = useCallback(async () => {
    try {
      const raw = await bridge.editorGetSettings();
      setEditorSettings({
        fontSize: parseInt(raw.fontSize || '14', 10),
        tabSize: parseInt(raw.tabSize || '4', 10),
        wordWrap: raw.wordWrap || 'off',
        theme: raw.theme || 'vs-dark',
        minimap: raw.minimap !== 'false',
        lineNumbers: raw.lineNumbers || 'on',
        autoSave: raw.autoSave !== 'false',
        autoSaveDelay: parseInt(raw.autoSaveDelay || '2000', 10),
        formatOnSave: raw.formatOnSave === 'true',
        formatOnSaveMode: raw.formatOnSaveMode || 'monaco',
      });
    } catch {}
  }, [bridge]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    (async () => {
      try {
        const roots = await bridge.getRoots();
        if (roots.length > 0) {
          const root = roots[0];
          const isRepo = await bridge.gitIsRepo(root);
          setRepoPath(isRepo ? root : '');
        }
      } catch {}
    })();
  }, [bridge]);

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

  const openFileInSplit = useCallback((path: string, side: 'left' | 'right') => {
    openFile(path).then(() => {
      if (side === 'right') {
        setRightTab(path);
        setSplitMode('both');
      }
    });
  }, [openFile]);

  const saveFile = useCallback(async (path: string, explicitContent?: string) => {
    const currentTabs = tabsRef.current;
    const tab = currentTabs.get(path);
    if (!tab) return;

    const content = explicitContent ?? tab.content;
    const success = await bridge.editorSaveFile(path, content);
    if (success) {
      setTabs(prev => {
        const next = new Map(prev);
        const t = next.get(path);
        if (t) {
          next.set(path, { ...t, info: { ...t.info, isDirty: false }, originalContent: content });
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

    if (rightTab === path) {
      setRightTab(null);
      setSplitMode('single');
    }
    setConfirmClose(null);
  }, [bridge, rightTab]);

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

  const handleSaveCurrent = useCallback((content?: string) => {
    if (activeTab) saveFile(activeTab, content);
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

  const getContextMenuItems = useCallback((path: string): ContextMenuItem[] => {
    const keys = Array.from(tabsRef.current.keys());
    return [
      {
        id: 'save', label: 'Salvar', icon: '💾', shortcut: 'Ctrl+S',
        onClick: () => saveFile(path),
      },
      {
        id: 'close', label: 'Fechar', icon: '✕', shortcut: 'Ctrl+W',
        onClick: () => closeFile(path),
      },
      { id: 'div1', label: '', divider: true, onClick: () => {} },
      {
        id: 'save-all', label: 'Salvar Todos', icon: '💾',
        onClick: () => keys.forEach(p => saveFile(p)),
      },
      {
        id: 'close-others', label: 'Fechar Outros', icon: '✕',
        onClick: () => keys.forEach(p => { if (p !== path) closeFile(p, true); }),
      },
      {
        id: 'close-all', label: 'Fechar Todos', icon: '✕', danger: true,
        onClick: () => keys.forEach(p => closeFile(p, true)),
      },
      { id: 'div2', label: '', divider: true, onClick: () => {} },
      {
        id: 'copy-path', label: 'Copiar Caminho', icon: '📋',
        onClick: () => bridge.copyToClipboard(path),
      },
      { id: 'div3', label: '', divider: true, onClick: () => {} },
      {
        id: 'open-left', label: 'Abrir no Painel Esquerdo', icon: '◀',
        onClick: () => { if (activeTab) setActiveTab(path); else openFile(path); setSplitMode('single'); },
      },
      {
        id: 'open-right', label: 'Abrir no Painel Direito', icon: '▶',
        onClick: () => openFileInSplit(path, 'right'),
      },
    ];
  }, [saveFile, closeFile, openFileInSplit, activeTab, openFile, bridge]);

  const contextMenuItems = contextMenu ? getContextMenuItems(contextMenu.path) : [];

  const handleToggleSplit = useCallback(() => {
    if (isSplit) {
      setSplitMode('single');
      setRightTab(null);
    } else if (activeTab) {
      setRightTab(activeTab);
      setSplitMode('both');
    }
  }, [isSplit, activeTab]);

  useAutoSave({
    enabled: editorSettings.autoSave,
    delay: editorSettings.autoSaveDelay,
    isDirty: activeState?.info.isDirty || false,
    content: activeState?.content || '',
    path: activeTab,
    onSave: saveFile,
  });

  const triggerCommand = useCallback((commandId: string) => {
    switch (commandId) {
      case 'file.save': handleSaveCurrent(); break;
      case 'file.close': handleCloseCurrent(); break;
      case 'file.open': setQuickOpenOpen(true); break;
      case 'editor.find': break;
      case 'editor.replace': break;
      case 'editor.split': handleToggleSplit(); break;
      case 'editor.close-split': if (isSplit) { setSplitMode('single'); setRightTab(null); } break;
      case 'editor.settings': setSettingsOpen(true); break;
      case 'view.sidebar': setSidebarOpen(v => !v); break;
      case 'view.terminal': break;
      case 'view.assistant': break;
      case 'view.knowledge': break;
    }
  }, [handleSaveCurrent, handleCloseCurrent, handleToggleSplit, isSplit]);

  const commands = [
    { id: 'file.save', label: 'Salvar', shortcut: 'Ctrl+S', category: 'file' as const, action: () => triggerCommand('file.save') },
    { id: 'file.close', label: 'Fechar', shortcut: 'Ctrl+W', category: 'file' as const, action: () => triggerCommand('file.close') },
    { id: 'file.open', label: 'Abrir Arquivo...', shortcut: 'Ctrl+P', category: 'file' as const, action: () => triggerCommand('file.open') },
    { id: 'editor.find', label: 'Buscar', shortcut: 'Ctrl+F', category: 'editor' as const, action: () => triggerCommand('editor.find') },
    { id: 'editor.replace', label: 'Buscar e Substituir', shortcut: 'Ctrl+H', category: 'editor' as const, action: () => triggerCommand('editor.replace') },
    { id: 'editor.split', label: 'Split View', category: 'editor' as const, action: () => triggerCommand('editor.split') },
    { id: 'editor.close-split', label: 'Fechar Split', category: 'editor' as const, action: () => triggerCommand('editor.close-split') },
    { id: 'editor.settings', label: 'Abrir Configurações', category: 'editor' as const, action: () => triggerCommand('editor.settings') },
    { id: 'view.sidebar', label: 'Toggle Sidebar', category: 'view' as const, action: () => triggerCommand('view.sidebar') },
    { id: 'view.terminal', label: 'Toggle Terminal', shortcut: 'Ctrl+`', category: 'view' as const, action: () => triggerCommand('view.terminal') },
    { id: 'view.assistant', label: 'Assistente IA', category: 'view' as const, action: () => triggerCommand('view.assistant') },
    { id: 'view.knowledge', label: 'Conhecimento', category: 'view' as const, action: () => triggerCommand('view.knowledge') },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(v => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setQuickOpenOpen(v => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        if (rightTab) setActiveTab(rightTab);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        const keys = Array.from(tabsRef.current.keys());
        if (keys.length > 0 && keys[0] !== activeTab) setActiveTab(keys[0]);
        return;
      }
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
  }, [activeTab, rightTab]);

  const isMd = activeState?.info.language === 'markdown';

  const monacoSettings = {
    fontSize: editorSettings.fontSize,
    tabSize: editorSettings.tabSize,
    wordWrap: editorSettings.wordWrap,
    minimap: editorSettings.minimap,
    lineNumbers: editorSettings.lineNumbers,
    theme: editorSettings.theme,
    formatOnSave: editorSettings.formatOnSave,
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <QuickOpen
        isOpen={quickOpenOpen}
        onClose={() => setQuickOpenOpen(false)}
        onSelect={(path) => {
          if (isSplit) openFileInSplit(path, 'right');
          else openFile(path);
        }}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />

      <EditorSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={loadSettings}
      />

      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-card">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          title="Toggle Sidebar"
        >
          ☰
        </button>
        <span className="text-xs text-muted-foreground font-medium ml-1">EDITOR</span>

        <div className="flex-1" />

        <button
          onClick={handleToggleSplit}
          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
            isSplit
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
          }`}
          title={isSplit ? 'Close Split' : 'Split Editor'}
        >
          ||
        </button>
        <button
          onClick={() => setQuickOpenOpen(true)}
          className="px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          title="Quick Open (Ctrl+P)"
        >
          🔍
        </button>
        {isMd && (
          <button
            onClick={() => setShowPreview(v => !v)}
            className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
              showPreview
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
            }`}
            title={showPreview ? 'Fechar Preview' : 'Preview Markdown'}
          >
            📄
          </button>
        )}
        <button
          onClick={() => setSettingsOpen(true)}
          className="px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          title="Settings"
        >
          ⚙
        </button>
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

      <Breadcrumb
        filePath={isSplit ? rightTab : activeTab}
        onNavigate={(path) => {
          if (isSplit) openFileInSplit(path, 'right');
          else openFile(path);
        }}
      />

      <ContextMenu
        state={contextMenu ? { x: contextMenu.x, y: contextMenu.y, items: contextMenuItems } : null}
        onClose={() => setContextMenu(null)}
      />

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
        {isSplit ? (
          <>
            <div className="flex-1 flex flex-col border-r border-border">
              {rightState ? (
                <MonacoWrapper
                  key={rightTab || 'right'}
                  value={rightState.content}
                  language={rightState.info.language}
                  path={rightTab || ''}
                  repoPath={repoPath}
                  onChange={(val) => rightTab && handleContentChange(rightTab, val)}
                  onCursorChange={(line, col) => setRightCursorPos({ line, col })}
                  onSave={(val) => rightTab && saveFile(rightTab, val)}
                  onClose={handleCloseCurrent}
                  settings={monacoSettings}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                  Selecione um arquivo
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              {activeState ? (
                <MonacoWrapper
                  key={activeTab || 'left'}
                  value={activeState.content}
                  language={activeState.info.language}
                  path={activeTab || ''}
                  repoPath={repoPath}
                  onChange={(val) => activeTab && handleContentChange(activeTab, val)}
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                  onSave={handleSaveCurrent}
                  onClose={handleCloseCurrent}
                  settings={monacoSettings}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                  Selecione um arquivo
                </div>
              )}
            </div>
          </>
        ) : showPreview && activeState ? (
          <>
            <div className="flex-1 flex flex-col">
              <MonacoWrapper
                key={activeTab || ''}
                value={activeState.content}
                language={activeState.info.language}
                path={activeTab || ''}
                repoPath={repoPath}
                onChange={(val) => activeTab && handleContentChange(activeTab, val)}
                onCursorChange={(line, col) => setCursorPos({ line, col })}
                onSave={handleSaveCurrent}
                onClose={handleCloseCurrent}
                settings={monacoSettings}
              />
            </div>
            <div className="w-[45%] border-l border-border flex flex-col">
              <MarkdownPreview
                content={activeState.content}
                visible={true}
              />
            </div>
          </>
        ) : activeState ? (
          <MonacoWrapper
            key={activeTab || ''}
            value={activeState.content}
            language={activeState.info.language}
            path={activeTab || ''}
            repoPath={repoPath}
            onChange={(val) => activeTab && handleContentChange(activeTab, val)}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
            onSave={handleSaveCurrent}
            onClose={handleCloseCurrent}
            settings={monacoSettings}
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
        <span className="flex items-center gap-2">
          {activeState && <>{activeState.info.language}</>}
          {editorSettings.autoSave && activeState && (
            <span className="text-[10px] text-green-500/70">auto-save</span>
          )}
        </span>
        <span>
          {isSplit
            ? `Left: Ln ${cursorPos.line}, Col ${cursorPos.col}  |  Right: Ln ${rightCursorPos.line}, Col ${rightCursorPos.col}`
            : activeState
              ? `Ln ${cursorPos.line}, Col ${cursorPos.col}`
              : ''
          }
        </span>
      </div>
    </div>
  );
}
