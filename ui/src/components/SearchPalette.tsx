import { useState, useEffect, useCallback, useRef } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';
import type { FileEntry } from '@/types';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  action: () => void;
}

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (path: string) => void;
  commands: CommandItem[];
}

export function SearchPalette({ isOpen, onClose, onOpenFile, commands }: SearchPaletteProps) {
  const bridge = useJarvis();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ files: FileEntry[]; cmds: CommandItem[] }>({ files: [], cmds: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'files' | 'commands'>('files');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const searchFiles = useCallback(async (q: string) => {
    if (!q || q.startsWith('>')) {
      setResults(prev => ({ ...prev, files: [] }));
      return;
    }
    try {
      const files = await bridge.editorSearchFiles(q);
      setResults(prev => ({ ...prev, files: files.slice(0, 12) }));
    } catch {
      setResults(prev => ({ ...prev, files: [] }));
    }
  }, [bridge]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ files: [], cmds: [] });
      setSelectedIndex(0);
      setMode('files');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.startsWith('>')) {
      const cmdQuery = q.slice(1).toLowerCase();
      const filtered = commands.filter(
        c => c.label.toLowerCase().includes(cmdQuery) || c.description.toLowerCase().includes(cmdQuery)
      );
      setResults(prev => ({ ...prev, cmds: filtered.slice(0, 12) }));
      setMode('commands');
      setSelectedIndex(0);
    } else {
      setMode('files');
      debounceRef.current = setTimeout(() => searchFiles(q), 150);
    }
  }, [query, commands, searchFiles]);

  const allItems = mode === 'commands' ? results.cmds : results.files;
  const totalItems = allItems.length;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (!item) return;
      if (mode === 'commands') {
        (item as CommandItem).action();
      } else {
        onOpenFile((item as FileEntry).path);
      }
      onClose();
    }
  }, [allItems, selectedIndex, mode, onClose, onOpenFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border px-3">
          <span className="text-muted-foreground text-xs mr-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files... (type &gt; for commands)"
            className="flex-1 py-2.5 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-[10px] text-muted-foreground/40">{mode === 'commands' ? 'Commands' : 'Files'}</span>
        </div>
        {allItems.length > 0 && (
          <div className="max-h-72 overflow-auto py-1">
            {allItems.map((item, index) => {
              const isFile = mode === 'files';
              const entry = item as FileEntry;
              const cmd = item as CommandItem;
              const ext = isFile ? entry.name.split('.').pop()?.toLowerCase() || '' : '';
              return (
                <div
                  key={isFile ? entry.path : cmd.id}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer ${
                    index === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/20'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    if (isFile) onOpenFile(entry.path);
                    else cmd.action();
                    onClose();
                  }}
                >
                  {isFile && (
                    <span className="w-4 text-center flex-shrink-0 text-[10px] text-muted-foreground">
                      {ext === 'ts' || ext === 'tsx' ? '🔵' : ext === 'js' || ext === 'jsx' ? '🟡' : ext === 'py' ? '🐍' : ext === 'rs' ? '🦀' : ext === 'md' ? '📝' : ext === 'json' ? '📋' : ext === 'html' ? '🌐' : ext === 'css' || ext === 'scss' ? '🎨' : ext === 'sql' ? '🗄️' : ext === 'toml' || ext === 'yaml' || ext === 'yml' ? '⚙️' : '📄'}
                    </span>
                  )}
                  {!isFile && <span className="w-4 text-center flex-shrink-0 text-[10px]">⚡</span>}
                  <span className="truncate">{isFile ? entry.name : cmd.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/50 truncate max-w-[180px]">
                    {isFile ? entry.path : cmd.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {query && allItems.length === 0 && (
          <div className="px-3 py-6 text-xs text-muted-foreground/50 text-center">
            {mode === 'commands' ? 'No matching commands' : 'No files found'}
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground/40">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto">type &gt; for commands</span>
        </div>
      </div>
    </div>
  );
}
