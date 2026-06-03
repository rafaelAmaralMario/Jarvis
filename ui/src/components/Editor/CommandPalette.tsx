import { useState, useEffect, useRef, useCallback } from 'react';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: 'editor' | 'file' | 'view' | 'git' | 'terminal';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const categoryLabel: Record<string, string> = {
    file: 'Arquivo',
    editor: 'Editor',
    view: 'Visualização',
    git: 'Git',
    terminal: 'Terminal',
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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
      filtered[cursor].action();
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filtered, cursor, onClose]);

  if (!isOpen) return null;

  let currentCategory = '';
  const categorizedItems = filtered.map((cmd, i) => {
    const showHeader = cmd.category !== currentCategory;
    currentCategory = cmd.category;
    return { cmd, i, showHeader };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-2xl w-[500px] max-h-[420px] flex flex-col overflow-hidden z-10">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
          />
          <span className="text-[10px] text-muted-foreground/50">Esc para fechar</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              Nenhum comando encontrado
            </div>
          )}
          {categorizedItems.map(({ cmd, i, showHeader }) => (
            <div key={cmd.id}>
              {showHeader && (
                <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
                  {categoryLabel[cmd.category] || cmd.category}
                </div>
              )}
              <div
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setCursor(i)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                  i === cursor ? 'bg-accent/30 text-foreground' : 'text-muted-foreground hover:bg-accent/20'
                }`}
              >
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="text-[10px] text-muted-foreground/50 font-mono">{cmd.shortcut}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
