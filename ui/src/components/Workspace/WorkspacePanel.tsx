import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileEntry, Project } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { FileTree } from './FileTree';
import { MonacoWrapper } from '@/components/Editor/MonacoWrapper';
import { EditorTabs } from '@/components/Editor/EditorTabs';
import { ImagePreview } from '@/components/Preview/ImagePreview';
import { PdfPreview } from '@/components/Preview/PdfPreview';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface WorkspacePanelProps {
  fileToOpen?: string;
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
  changed: boolean;
}

export function WorkspacePanel({ fileToOpen }: WorkspacePanelProps) {
  const bridge = useJarvis();
  const [_roots, setRoots] = useState<string[]>([]);
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [recentFiles, setRecentFiles] = useState<FileEntry[]>([]);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 4,
    wordWrap: 'off',
    theme: 'vs-dark',
    minimap: true,
    lineNumbers: 'on',
    autoSave: true,
    autoSaveDelay: 2000,
  });

  function detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', java: 'java',
      cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp',
      cs: 'csharp', swift: 'swift', kotlin: 'kotlin',
      html: 'html', css: 'css', scss: 'scss', less: 'less',
      json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml',
      md: 'markdown', sql: 'sql', sh: 'shell', bash: 'shell',
      dockerfile: 'dockerfile', tf: 'terraform', rb: 'ruby',
      php: 'php', r: 'r', scala: 'scala', lua: 'lua',
      toml: 'ini', ini: 'ini', cfg: 'ini',
    };
    return langMap[ext] || 'plaintext';
  }

  // Folder picker dialog state
  const [folderInput, setFolderInput] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rootList = await bridge.getRoots();
      setRoots(rootList);

      if (rootList.length > 0) {
        const proj = await bridge.getProjectInfo(rootList[0]);
        setProject(proj);

        // Load file tree for each root
        const allEntries: FileEntry[] = [];
        for (const root of rootList) {
          const entries = await loadTree(root);
          allEntries.push(...entries);
        }
        setTree(allEntries);

        const recent = await bridge.getRecentFiles(10);
        setRecentFiles(recent);
      } else {
        setTree([]);
        setProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (fileToOpen) {
      handleSelectFile(fileToOpen);
    }
  }, [fileToOpen]);

  useEffect(() => {
    bridge.editorGetSettings().then(raw => {
      if (raw) {
        setEditorSettings({
          fontSize: parseInt(raw.fontSize || '14', 10),
          tabSize: parseInt(raw.tabSize || '4', 10),
          wordWrap: raw.wordWrap || 'off',
          theme: raw.theme || 'vs-dark',
          minimap: raw.minimap !== 'false',
          lineNumbers: raw.lineNumbers || 'on',
          autoSave: raw.autoSave !== 'false',
          autoSaveDelay: parseInt(raw.autoSaveDelay || '2000', 10),
        });
      }
    }).catch(() => {});
  }, [bridge]);

  async function loadTree(rootPath: string): Promise<FileEntry[]> {
    const entries = await bridge.listFiles(rootPath);
    // Build children recursively
    for (const entry of entries) {
      if (entry.isDirectory) {
        entry.children = await loadTree(entry.path);
      }
    }
    return entries;
  }

  async function handleOpenFolder() {
    const nativePath = await bridge.showFolderPicker();
    if (nativePath) {
      try {
        await bridge.addRoot(nativePath);
        await loadWorkspace();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } else {
      setShowFolderInput(true);
    }
  }

  async function handleAddRoot() {
    const path = folderInput.trim();
    if (!path) return;
    try {
      await bridge.addRoot(path);
      setFolderInput('');
      setShowFolderInput(false);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSelectFile(path: string) {
    setSelectedPath(path);

    // Open inline with Monaco
    const existing = openTabs.find(t => t.path === path);
    if (existing) {
      setActiveTab(path);
      setEditingContent(existing.content);
      return;
    }

    try {
      const content = await bridge.readFile(path);
      const name = path.split(/[/\\]/).pop() || path;
      const tab: OpenTab = { path, name, content, changed: false };
      setOpenTabs(prev => [...prev, tab]);
      setActiveTab(path);
      setEditingContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSaveFile(path: string) {
    try {
      await bridge.writeFile(path, editingContent);
      setOpenTabs(prev => prev.map(t => t.path === path ? { ...t, content: editingContent, changed: false } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleCloseTab(path: string) {
    setOpenTabs(prev => prev.filter(t => t.path !== path));
    if (activeTab === path) {
      const remaining = openTabs.filter(t => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
      setEditingContent(remaining.length > 0 ? remaining[remaining.length - 1].content : '');
    }
  }

  async function handleDeleteFile(path: string) {
    try {
      await bridge.deletePath(path);
      handleCloseTab(path);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateFile(parentDir: string, name: string) {
    if (!name) return;
    try {
      if (name.includes('/')) {
        await bridge.createFileWithPath(parentDir ? parentDir + '/' + name : name);
      } else {
        await bridge.createFile(name, parentDir || '');
      }
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateFolder(parentDir: string, name: string) {
    if (!name) return;
    try {
      await bridge.createDirectory(name, parentDir || '');
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateFileWithPath(fullPath: string) {
    try {
      await bridge.createFileWithPath(fullPath);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRename(oldPath: string, newName: string) {
    if (!newName) return;
    const parts = oldPath.split(/[/\\]/);
    const oldName = parts[parts.length - 1];
    if (newName === oldName) return;
    try {
      await bridge.renamePath(oldPath, newName);
      parts[parts.length - 1] = newName;
      const newPath = parts.join('/');
      setOpenTabs(prev => prev.map(t => t.path === oldPath ? { ...t, path: newPath, name: newName } : t));
      if (activeTab === oldPath) setActiveTab(newPath);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function isImageFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext);
  }

  function isPdfFile(name: string): boolean {
    return (name.split('.').pop()?.toLowerCase() || '') === 'pdf';
  }

  function handleMoveFile(sourcePath: string, targetDir: string) {
    bridge.movePath(sourcePath, targetDir).then(() => loadWorkspace()).catch(() => {});
  }

  const currentTab = openTabs.find(t => t.path === activeTab);

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring}
            className="border-r border-border bg-card overflow-hidden flex-shrink-0"
          >
            <div className="w-[280px] h-full flex flex-col">
              {/* Workspace header */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {project ? project.name : 'Workspace'}
                  </h3>
                  <button
                    onClick={handleOpenFolder}
                    className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    + Add Folder
                  </button>
                </div>

                <AnimatePresence>
                  {showFolderInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex gap-1 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={folderInput}
                        onChange={(e) => setFolderInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRoot()}
                        placeholder="Full path to folder..."
                        className="flex-1 px-2 py-1 rounded text-xs bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <button
                        onClick={handleAddRoot}
                        className="px-2 py-1 rounded text-xs bg-primary text-primary-foreground"
                      >
                        Add
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {project && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground/60">
                    <span className="px-1.5 py-0.5 rounded bg-accent/30">{project.type}</span>
                    {project.version && <span>v{project.version}</span>}
                  </div>
                )}
              </div>

              {/* File tree */}
              <div className="flex-1 overflow-auto py-2">
                {loading ? (
                  <div className="px-4 py-8 text-xs text-muted-foreground animate-pulse text-center">
                    Loading workspace...
                  </div>
                ) : tree.length === 0 ? (
                  <div className="px-4 py-8 text-xs text-muted-foreground text-center">
                    <p className="text-2xl mb-2">📂</p>
                    <p>No workspace open.</p>
                    <p className="mt-1 text-[10px]">Click "Add Folder" to open a project.</p>
                  </div>
                ) : (
                  <FileTree
                    entries={tree}
                    onSelectFile={handleSelectFile}
                    onDeleteFile={handleDeleteFile}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onRename={handleRename}
                    onMoveFile={handleMoveFile}
                    selectedPath={selectedPath}
                    onCreateFileWithPath={handleCreateFileWithPath}
                    roots={_roots}
                    onOpenProject={() => setShowFolderInput(true)}
                  />
                )}
              </div>

              {/* Recent files */}
              {recentFiles.length > 0 && (
                <div className="border-t border-border p-3">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recent
                  </h4>
                  <div className="space-y-1">
                    {recentFiles.slice(0, 5).map((rf) => (
                      <button
                        key={rf.path}
                        onClick={() => handleSelectFile(rf.path)}
                        className="w-full text-left px-2 py-1 rounded text-[11px] hover:bg-accent/30 truncate transition-colors"
                      >
                        {rf.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {error && (
            <div className="ml-auto px-2 py-0.5 rounded bg-red-950/20 border border-red-900/40 text-[10px] text-red-400">
              {error}
              <button onClick={() => setError(null)} className="ml-1.5 hover:text-red-300">✕</button>
            </div>
          )}
        </div>

        <EditorTabs
          tabs={openTabs.map(t => ({
            path: t.path,
            name: t.name,
            language: '',
            size: 0,
            lastModified: 0,
            isDirty: t.changed,
          }))}
          activeTab={activeTab}
          onSelectTab={(path) => {
            setActiveTab(path);
            const tab = openTabs.find(t => t.path === path);
            if (tab) setEditingContent(tab.content);
          }}
          onCloseTab={handleCloseTab}
          onReorderTabs={(from, to) => {
            setOpenTabs(prev => {
              const arr = [...prev];
              const [moved] = arr.splice(from, 1);
              arr.splice(to, 0, moved);
              return arr;
            });
          }}
        />

        <div className="flex-1 flex overflow-hidden">
          {activeTab && currentTab ? (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative">
                {isImageFile(currentTab.name) ? (
                  <ImagePreview path={currentTab.path} />
                ) : isPdfFile(currentTab.name) ? (
                  <PdfPreview path={currentTab.path} />
                ) : (
                  <MonacoWrapper
                    value={editingContent}
                    language={detectLanguage(currentTab.name)}
                    path={currentTab.path}
                    onChange={(value) => {
                      setEditingContent(value);
                      setOpenTabs(prev => prev.map(t => t.path === activeTab ? { ...t, changed: true } : t));
                    }}
                    onSave={() => handleSaveFile(activeTab)}
                    settings={editorSettings}
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-1.5 border-t border-border text-[10px] text-muted-foreground bg-card">
                <span>{currentTab.name}</span>
                <div className="flex items-center gap-3">
                  <span>{currentTab.changed ? '● unsaved' : '○ saved'}</span>
                  <span>{editingContent.length} chars</span>
                  {currentTab.changed && (
                    <button
                      onClick={() => handleSaveFile(currentTab.path)}
                      className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-4xl mb-3">⌨️</p>
                <p className="text-sm">Select a file from the explorer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
