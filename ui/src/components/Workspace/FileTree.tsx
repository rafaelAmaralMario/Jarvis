import { useState, useCallback, useEffect, useRef } from 'react';
import type { FileEntry } from '@/types';

interface FileTreeProps {
  entries: FileEntry[];
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCreateFile: (parentDir: string) => void;
  onCreateFolder: (parentDir: string) => void;
  onRename: (oldPath: string, currentName: string) => void;
  selectedPath?: string;
  depth?: number;
  onCreateFileWithPath?: (fullPath: string) => void;
}

function fileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  const ext = entry.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return '🔵';
    case 'js': case 'jsx': return '🟡';
    case 'mjs': return '🟡';
    case 'cjs': return '🟡';
    case 'cpp': case 'cxx': case 'cc': return '🔷';
    case 'h': case 'hpp': return '🔶';
    case 'md': return '📝';
    case 'json': return '📋';
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'scss': return '🎨';
    case 'py': return '🐍';
    case 'rs': return '🦀';
    case 'toml': return '⚙️';
    case 'yaml': case 'yml': return '📄';
    case 'sql': return '🗄️';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': return '🖼️';
    case 'pdf': return '📕';
    default: return '📄';
  }
}

interface ContextMenuState {
  x: number;
  y: number;
  entry: FileEntry | null;
}

export function FileTree({ entries, onSelectFile, onDeleteFile, onCreateFile, onCreateFolder, onRename, selectedPath, depth = 0, onCreateFileWithPath }: FileTreeProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ path: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [createMode, setCreateMode] = useState<'file' | 'folder' | null>(null);
  const [createParent, setCreateParent] = useState('');
  const [createValue, setCreateValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renameInputRef.current) renameInputRef.current.focus();
  }, [renameTarget]);

  useEffect(() => {
    if (createInputRef.current) createInputRef.current.focus();
  }, [createMode]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  function toggleCollapse(path: string) {
    setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, []);

  const handleContextAction = useCallback((action: string) => {
    const entry = contextMenu?.entry;
    setContextMenu(null);

    if (!entry) return;

    switch (action) {
      case 'new-file':
        setCreateMode('file');
        setCreateParent(entry.isDirectory ? entry.path : entry.path.split(/[/\\]/).slice(0, -1).join('/'));
        setCreateValue('');
        break;
      case 'new-folder':
        setCreateMode('folder');
        setCreateParent(entry.isDirectory ? entry.path : entry.path.split(/[/\\]/).slice(0, -1).join('/'));
        setCreateValue('');
        break;
      case 'rename':
        setRenameTarget({ path: entry.path, name: entry.name });
        setRenameValue(entry.name);
        break;
      case 'delete':
        if (confirm(`Delete "${entry.name}"?`)) onDeleteFile(entry.path);
        break;
      case 'open':
        if (!entry.isDirectory) onSelectFile(entry.path);
        break;
    }
  }, [contextMenu, onDeleteFile, onSelectFile]);

  const handleRenameSubmit = useCallback(() => {
    if (renameTarget && renameValue.trim()) {
      onRename(renameTarget.path, renameValue.trim());
    }
    setRenameTarget(null);
    setRenameValue('');
  }, [renameTarget, renameValue, onRename]);

  const handleCreateSubmit = useCallback(() => {
    if (!createValue.trim()) {
      setCreateMode(null);
      return;
    }

    if (createMode === 'file') {
      // Support batch creation: "folder/file.txt" or "/parent/child/file.txt"
      if (onCreateFileWithPath && createValue.includes('/')) {
        const fullPath = createParent
          ? createParent + '/' + createValue
          : createValue;
        onCreateFileWithPath(fullPath);
      } else {
        onCreateFile(createParent);
        // Pass the name via a different mechanism — the existing prompt is used
        // We'll handle this via the prompt in the parent
      }
    } else {
      if (createValue.includes('/') && onCreateFileWithPath) {
        const fullPath = createParent
          ? createParent + '/' + createValue
          : createValue;
        onCreateFileWithPath(fullPath);
      } else {
        onCreateFolder(createParent);
      }
    }
    setCreateMode(null);
    setCreateValue('');
  }, [createMode, createValue, createParent, onCreateFile, onCreateFolder, onCreateFileWithPath]);

  const handleCreateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateSubmit();
    if (e.key === 'Escape') setCreateMode(null);
  }, [handleCreateSubmit]);

  return (
    <div className="select-none text-sm">
      {sorted.map((entry) => (
        <div key={entry.path}>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer group hover:bg-accent/30 transition-colors ${
              selectedPath === entry.path ? 'bg-accent text-accent-foreground' : 'text-foreground'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (entry.isDirectory) {
                toggleCollapse(entry.path);
              } else {
                onSelectFile(entry.path);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, entry)}
          >
            {entry.isDirectory && (
              <span className="text-[10px] text-muted-foreground w-3 text-center flex-shrink-0">
                {collapsed[entry.path] ? '▶' : '▼'}
              </span>
            )}
            {!entry.isDirectory && <span className="w-3 flex-shrink-0" />}
            <span className="flex-shrink-0">{fileIcon(entry)}</span>

            {renameTarget?.path === entry.path ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setRenameTarget(null);
                }}
                onBlur={handleRenameSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 min-w-0 px-1 py-0.5 text-xs bg-background border border-primary/50 rounded focus:outline-none"
              />
            ) : (
              <span className="flex-1 truncate">{entry.name}</span>
            )}

            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); onSelectFile(entry.path); }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                title="Open"
              >▶</button>
              {entry.isDirectory && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCreateMode('file'); setCreateParent(entry.path); setCreateValue(''); }}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                    title="New file"
                  >+</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCreateMode('folder'); setCreateParent(entry.path); setCreateValue(''); }}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                    title="New folder"
                  >📁+</button>
                </>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setRenameTarget({ path: entry.path, name: entry.name }); setRenameValue(entry.name); }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                title="Rename"
              >✎</button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${entry.name}"?`)) onDeleteFile(entry.path); }}
                className="p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 text-[10px]"
                title="Delete"
              >✕</button>
            </div>
          </div>

          {/* Inline create input */}
          {createMode && createParent === entry.path && (
            <div
              className="flex items-center gap-1.5 px-2 py-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <span className="text-xs text-muted-foreground">
                {createMode === 'file' ? '📄' : '📁'}
              </span>
              <input
                ref={createInputRef}
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (createMode === 'file') {
                      if (onCreateFileWithPath && createValue.includes('/')) {
                        onCreateFileWithPath(createParent + '/' + createValue);
                      } else {
                        onCreateFile(createParent);
                        setTimeout(() => {
                          // The parent uses prompt, so we set a timeout
                        }, 0);
                      }
                    } else {
                      onCreateFolder(createParent);
                    }
                    setCreateMode(null);
                    setCreateValue('');
                  }
                  if (e.key === 'Escape') {
                    setCreateMode(null);
                    setCreateValue('');
                  }
                }}
                onBlur={() => { setCreateMode(null); setCreateValue(''); }}
                placeholder={createMode === 'file' ? 'arquivo.txt ou pasta/arquivo.txt' : 'nome-da-pasta'}
                className="flex-1 min-w-0 px-1.5 py-0.5 text-xs bg-background border border-primary/50 rounded focus:outline-none placeholder:text-muted-foreground/40"
                autoFocus
              />
            </div>
          )}

          {entry.isDirectory && entry.children && !collapsed[entry.path] && (
            <FileTree
              entries={entry.children}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              selectedPath={selectedPath}
              depth={depth + 1}
              onCreateFileWithPath={onCreateFileWithPath}
            />
          )}
        </div>
      ))}

      {createMode && createParent === '' && depth === 0 && (
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className="text-xs text-muted-foreground">
            {createMode === 'file' ? '📄' : '📁'}
          </span>
          <input
            ref={createInputRef}
            value={createValue}
            onChange={(e) => setCreateValue(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            onBlur={() => { setCreateMode(null); setCreateValue(''); }}
            placeholder={createMode === 'file' ? 'arquivo.txt ou pasta/arquivo.txt' : 'nome-da-pasta'}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-xs bg-background border border-primary/50 rounded focus:outline-none placeholder:text-muted-foreground/40"
            autoFocus
          />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { if (contextMenu.entry && !contextMenu.entry.isDirectory) onSelectFile(contextMenu.entry.path); setContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
          >
            ▶ Abrir
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => handleContextAction('new-file')}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
          >
            📄 Novo Arquivo
          </button>
          <button
            onClick={() => handleContextAction('new-folder')}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
          >
            📁 Nova Pasta
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => handleContextAction('rename')}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors"
          >
            ✎ Renomear
          </button>
          <button
            onClick={() => handleContextAction('delete')}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/20 text-red-400 transition-colors"
          >
            ✕ Excluir
          </button>
        </div>
      )}
    </div>
  );
}
