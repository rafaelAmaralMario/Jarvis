import { useState, useCallback, useEffect, useRef } from 'react';
import type { FileEntry } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { ContextMenuItem } from '@/components/ui/ContextMenu';
import { FileIcon } from './FileIcon';

interface FileTreeProps {
  entries: FileEntry[];
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCreateFile: (parentDir: string, name: string) => void;
  onCreateFolder: (parentDir: string, name: string) => void;
  onRename: (oldPath: string, newName: string) => void;
  onMoveFile?: (sourcePath: string, targetDir: string) => void;
  selectedPath?: string;
  depth?: number;
  onCreateFileWithPath?: (fullPath: string) => void;
  roots?: string[];
  onOpenProject?: () => void;
}

export function FileTree({ entries, onSelectFile, onDeleteFile, onCreateFile, onCreateFolder, onRename, onMoveFile, selectedPath, depth = 0, onCreateFileWithPath, roots, onOpenProject }: FileTreeProps) {
  const bridge = useJarvis();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry | null } | null>(null);
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

  function toggleCollapse(path: string) {
    setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  const getRelativePath = useCallback(async (path: string) => {
    if (roots && roots.length > 0) {
      return bridge.getRelativePath(roots[0], path);
    }
    return path;
  }, [roots, bridge]);

  const getContextMenuItems = useCallback((entry: FileEntry | null): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    if (!entry) {
      items.push({
        id: 'new-file-root', label: 'Novo Arquivo', icon: '📄',
        onClick: () => { setCreateMode('file'); setCreateParent(''); setCreateValue(''); },
      });
      items.push({
        id: 'new-folder-root', label: 'Nova Pasta', icon: '📁',
        onClick: () => { setCreateMode('folder'); setCreateParent(''); setCreateValue(''); },
      });
      items.push({ id: 'divider2', label: '', divider: true, onClick: () => {} });
      items.push({
        id: 'open-project', label: 'Abrir Projeto...', icon: '📂',
        onClick: () => onOpenProject?.(),
      });
      items.push({ id: 'divider-ai-root', label: '', divider: true, onClick: () => {} });
      items.push({
        id: 'analyze-project', label: 'Analisar Projeto', icon: '📊',
        onClick: () => {
          const root = roots?.[0] || '';
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Analise o projeto em ${root}. Resuma a arquitetura, tecnologias usadas, e sugira melhorias.` }
          }));
        },
      });
      items.push({
        id: 'suggest-features', label: 'Suggest Features', icon: '💡',
        onClick: () => {
          const root = roots?.[0] || '';
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Analise o projeto em ${root} e sugira novas features baseadas no código existente. Crie um arquivo SUGGESTIONS.md com as recomendações.` }
          }));
        },
      });
      items.push({
        id: 'create-env', label: 'Criar .env.example', icon: '🔐',
        onClick: () => {
          const root = roots?.[0] || '';
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Analise o projeto em ${root} e crie um arquivo .env.example com todas as variáveis de ambiente necessárias baseadas no código fonte.` }
          }));
        },
      });
      return items;
    }

    if (entry.isDirectory) {
      items.push({
        id: 'new-file', label: 'Novo Arquivo', icon: '📄',
        onClick: () => { setCreateMode('file'); setCreateParent(entry.path); setCreateValue(''); },
      });
      items.push({
        id: 'new-folder', label: 'Nova Pasta', icon: '📁',
        onClick: () => { setCreateMode('folder'); setCreateParent(entry.path); setCreateValue(''); },
      });
      items.push({ id: 'divider1', label: '', divider: true, onClick: () => {} });
      items.push({
        id: 'rename', label: 'Renomear', icon: '✎',
        onClick: () => { setRenameTarget({ path: entry.path, name: entry.name }); setRenameValue(entry.name); },
      });
      items.push({
        id: 'delete', label: 'Excluir', icon: '✕', danger: true,
        onClick: () => { if (confirm(`Delete "${entry.name}"?`)) onDeleteFile(entry.path); },
      });
      items.push({ id: 'divider-ai-dir', label: '', divider: true, onClick: () => {} });
      items.push({
        id: 'review-project', label: 'Revisar Projeto', icon: '🔍',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Revise o projeto em ${entry.path}. Analise a estrutura, padrões de código, e sugira melhorias.` }
          }));
        },
      });
      items.push({
        id: 'create-tests', label: 'Criar Testes', icon: '🧪',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Crie testes para os arquivos em ${entry.path}. Siga os padrões de teste existentes no projeto.` }
          }));
        },
      });
      items.push({
        id: 'create-docs', label: 'Criar Documentação', icon: '📝',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Crie documentação para o código em ${entry.path}. Inclua README, comentários de API, e exemplos de uso.` }
          }));
        },
      });
      items.push({
        id: 'refactor', label: 'Refatorar', icon: '🔧',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Refatore o código em ${entry.path}. Melhore a legibilidade, remova duplicação, e aplique boas práticas.` }
          }));
        },
      });
    } else {
      items.push({
        id: 'open', label: 'Abrir', icon: '▶',
        onClick: () => onSelectFile(entry.path),
      });
      items.push({ id: 'divider3', label: '', divider: true, onClick: () => {} });
      items.push({
        id: 'rename', label: 'Renomear', icon: '✎',
        onClick: () => { setRenameTarget({ path: entry.path, name: entry.name }); setRenameValue(entry.name); },
      });
      items.push({
        id: 'delete', label: 'Excluir', icon: '✕', danger: true,
        onClick: () => { if (confirm(`Delete "${entry.name}"?`)) onDeleteFile(entry.path); },
      });
      items.push({ id: 'divider-ai-file', label: '', divider: true, onClick: () => {} });
      items.push({
        id: 'send-to-chat', label: 'Enviar para o Chat', icon: '💬',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('jarvis:send-to-chat', {
            detail: { message: `Analise o arquivo ${entry.path}:\n\n\`\`\`\n${entry.path}\n\`\`\`\n\nExplique o que este arquivo faz e sugira melhorias.` }
          }));
        },
      });
    }

    items.push({ id: 'divider4', label: '', divider: true, onClick: () => {} });
    items.push({
      id: 'copy-path', label: 'Copiar Caminho', icon: '📋',
      onClick: () => bridge.copyToClipboard(entry.path),
    });
    items.push({
      id: 'copy-relative', label: 'Copiar Caminho Relativo', icon: '📋',
      onClick: async () => {
        const rel = await getRelativePath(entry.path);
        bridge.copyToClipboard(rel);
      },
    });
    items.push({ id: 'divider5', label: '', divider: true, onClick: () => {} });
    items.push({
      id: 'reveal', label: 'Abrir Pasta do Arquivo', icon: '📂',
      onClick: () => bridge.revealInExplorer(entry.path),
    });

    return items;
  }, [onSelectFile, onDeleteFile, onRename, bridge, getRelativePath, onOpenProject]);

  const contextMenuItems = contextMenu ? getContextMenuItems(contextMenu.entry) : [];

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, []);

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
      if (onCreateFileWithPath && createValue.includes('/')) {
        const fullPath = createParent ? createParent + '/' + createValue : createValue;
        onCreateFileWithPath(fullPath);
      } else {
        onCreateFile(createParent, createValue.trim());
      }
    } else {
      if (createValue.includes('/') && onCreateFileWithPath) {
        const fullPath = createParent ? createParent + '/' + createValue : createValue;
        onCreateFileWithPath(fullPath);
      } else {
        onCreateFolder(createParent, createValue.trim());
      }
    }
    setCreateMode(null);
    setCreateValue('');
  }, [createMode, createValue, createParent, onCreateFile, onCreateFolder, onCreateFileWithPath]);

  const handleCreateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateSubmit();
    if (e.key === 'Escape') setCreateMode(null);
  }, [handleCreateSubmit]);

  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, path: string) => {
    e.dataTransfer.setData('text/plain', path);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPath(path);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverPath(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath && sourcePath !== targetPath && onMoveFile) {
      onMoveFile(sourcePath, targetPath);
    }
  }, [onMoveFile]);

  return (
    <div data-context-menu-enabled className="select-none text-sm" onContextMenu={(e) => handleContextMenu(e, null)}>
      {sorted.map((entry) => (
        <div key={entry.path}
          draggable={!entry.isDirectory}
          onDragStart={(e) => handleDragStart(e, entry.path)}
          onDragOver={(e) => entry.isDirectory && handleDragOver(e, entry.path)}
          onDragLeave={entry.isDirectory ? handleDragLeave : undefined}
          onDrop={(e) => entry.isDirectory && handleDrop(e, entry.path)}
        >
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer group hover:bg-accent/30 transition-colors ${
              selectedPath === entry.path ? 'bg-accent text-accent-foreground' : 'text-foreground'
            } ${dragOverPath === entry.path && entry.isDirectory ? 'bg-accent/40 ring-1 ring-primary/40' : ''}`}
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
            <FileIcon entry={entry} />

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
                        onCreateFile(createParent, createValue.trim());
                      }
                    } else {
                      onCreateFolder(createParent, createValue.trim());
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
              onMoveFile={onMoveFile}
              selectedPath={selectedPath}
              depth={depth + 1}
              onCreateFileWithPath={onCreateFileWithPath}
              roots={roots}
              onOpenProject={onOpenProject}
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

      <ContextMenu
        state={contextMenu ? { x: contextMenu.x, y: contextMenu.y, items: contextMenuItems } : null}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
