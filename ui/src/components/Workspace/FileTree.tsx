import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

function fileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  const ext = entry.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return '🔵';
    case 'js': case 'jsx': return '🟡';
    case 'cpp': case 'cxx': case 'cc': return '🔷';
    case 'h': case 'hpp': return '🔶';
    case 'md': return '📝';
    case 'json': return '📋';
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'py': return '🐍';
    case 'rs': return '🦀';
    case 'toml': return '⚙️';
    case 'yaml': case 'yml': return '📄';
    case 'sql': return '🗄️';
    case 'png': case 'jpg': case 'svg': return '🖼️';
    default: return '📄';
  }
}

export function FileTree({ entries, onSelectFile, onDeleteFile, onCreateFile, onCreateFolder, onRename, selectedPath, depth = 0 }: FileTreeProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleCollapse(path: string) {
    setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="select-none">
      {sorted.map((entry) => (
        <div key={entry.path}>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer group hover:bg-accent/30 transition-colors text-sm ${
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
            onContextMenu={(e) => {
              e.preventDefault();
            }}
          >
            {entry.isDirectory && (
              <span className="text-[10px] text-muted-foreground w-3 text-center">
                {collapsed[entry.path] ? '▶' : '▼'}
              </span>
            )}
            {!entry.isDirectory && <span className="w-3" />}
            <span className="text-sm">{fileIcon(entry)}</span>
            <span className="flex-1 truncate text-sm">{entry.name}</span>
            <div className="hidden group-hover:flex items-center gap-0.5">
              {entry.isDirectory && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateFile(entry.path); }}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                    title="New file"
                  >+</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateFolder(entry.path); }}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                    title="New folder"
                  >📁+</button>
                </>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onRename(entry.path, entry.name); }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-[10px]"
                title="Rename"
              >✎</button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFile(entry.path); }}
                className="p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 text-[10px]"
                title="Delete"
              >✕</button>
            </div>
          </div>

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
            />
          )}
        </div>
      ))}
    </div>
  );
}
