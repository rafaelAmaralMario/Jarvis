import { useState, useRef, useEffect } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';
import type { FileEntry } from '@/types';

interface BreadcrumbProps {
  filePath: string | null;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ filePath, onNavigate }: BreadcrumbProps) {
  const bridge = useJarvis();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, FileEntry[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parts = filePath
    ? filePath.replace(/\\/g, '/').split('/').filter(Boolean)
    : [];

  const buildPath = (idx: number) => parts.slice(0, idx + 1).join('/');

  const handleSegmentClick = async (segmentPath: string) => {
    if (openDropdown === segmentPath) {
      setOpenDropdown(null);
      return;
    }
    if (!entries[segmentPath]) {
      const result = await bridge.listDirectory(segmentPath);
      setEntries(prev => ({ ...prev, [segmentPath]: result }));
    }
    setOpenDropdown(segmentPath);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!filePath || parts.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground bg-card border-b border-border overflow-x-auto scrollbar-none">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        const segmentPath = buildPath(i);
        return (
          <div key={segmentPath} className="flex items-center gap-0.5 relative">
            {i > 0 && (
              <span className="text-muted-foreground/40 mx-0.5">▸</span>
            )}
            <button
              onClick={() => isLast ? null : handleSegmentClick(segmentPath)}
              className={`px-1 py-0.5 rounded hover:bg-accent/20 transition-colors whitespace-nowrap ${
                isLast ? 'text-foreground font-medium cursor-default' : 'hover:text-foreground cursor-pointer'
              }`}
            >
              {part}
            </button>
            {openDropdown === segmentPath && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-[180px] max-h-[250px] overflow-y-auto"
              >
                {(entries[segmentPath] || []).map(entry => (
                  <button
                    key={entry.path}
                    onClick={() => {
                      onNavigate(entry.path);
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1 text-xs hover:bg-accent/30 transition-colors flex items-center gap-2"
                  >
                    <span>{entry.isDirectory ? '📁' : '📄'}</span>
                    <span className="truncate">{entry.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
