import { useEffect, useRef } from 'react';
import { File } from 'lucide-react';
import type { QuickOpenResult } from '../hooks/useQuickOpen';

interface QuickOpenProps {
  isOpen: boolean;
  query: string;
  results: QuickOpenResult[];
  selectedIndex: number;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelect: (result: QuickOpenResult) => void;
  onSelectNext: () => void;
  onSelectPrev: () => void;
}

export function QuickOpen({
  isOpen,
  query,
  results,
  selectedIndex,
  onQueryChange,
  onClose,
  onSelect,
  onSelectNext,
  onSelectPrev,
}: QuickOpenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const el = resultRefs.current.get(selectedIndex);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="quick-open" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
              return;
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              onSelectNext();
              return;
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              onSelectPrev();
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              const selected = results[selectedIndex];
              if (selected) {
                onSelect(selected);
              }
              return;
            }
          }}
          placeholder="Buscar arquivos por nome..."
        />
        <div className="quick-open-results">
          {results.length === 0 && (
            <div className="quick-open-empty">Nenhum arquivo encontrado</div>
          )}
          {results.map((result, index) => (
            <button
              key={result.path}
              className={index === selectedIndex ? 'quick-open-item selected' : 'quick-open-item'}
              onClick={() => onSelect(result)}
              onMouseEnter={() => {
                const ref = resultRefs.current.get(index);
                if (ref) resultRefs.current.delete(index);
                resultRefs.current.set(index, ref!);
              }}
              ref={(el) => {
                if (el) resultRefs.current.set(index, el);
              }}
              type="button"
            >
              <File size={14} />
              <span className="quick-open-name">{result.name}</span>
              <span className="quick-open-path">{result.path}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
