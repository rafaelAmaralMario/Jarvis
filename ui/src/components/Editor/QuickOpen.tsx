import { useState, useEffect, useRef, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';
import type { FileEntry } from '@/types';

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function QuickOpen({ isOpen, onClose, onSelect }: QuickOpenProps) {
  const bridge = useJarvis();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);

  const filtered = query.trim()
    ? files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : files;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      setLoading(true);
      bridge.editorSearchFiles('').then(all => {
        setFiles(all);
        setLoading(false);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, bridge]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && filtered[cursor]) {
      e.preventDefault();
      onSelect(filtered[cursor].path);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, cursor, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-2xl w-[500px] max-h-[400px] flex flex-col overflow-hidden z-10">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar arquivos..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
          />
          <span className="text-[10px] text-muted-foreground/50">Esc para fechar</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              Carregando...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              Nenhum arquivo encontrado
            </div>
          )}
          {filtered.map((file, i) => (
            <div
              key={file.path}
              onClick={() => {
                onSelect(file.path);
                onClose();
              }}
              onMouseEnter={() => setCursor(i)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                i === cursor ? 'bg-accent/30 text-foreground' : 'text-muted-foreground hover:bg-accent/20'
              }`}
            >
              <span className="text-foreground/60">{file.isDirectory ? '📁' : '📄'}</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-medium">{file.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground/50">{file.relativePath}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
