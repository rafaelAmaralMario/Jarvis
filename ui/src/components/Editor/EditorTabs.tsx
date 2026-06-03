import { useRef, useEffect, useCallback } from 'react';
import type { EditorTabInfo } from '@/types';

interface EditorTabsProps {
  tabs: EditorTabInfo[];
  activeTab: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, path: string) => void;
}

export function EditorTabs({ tabs, activeTab, onSelectTab, onCloseTab, onContextMenu }: EditorTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && activeTab) {
      const activeEl = containerRef.current.querySelector(`[data-tab-path="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  const handleMouseDown = useCallback((e: React.MouseEvent, path: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onCloseTab(path);
    }
  }, [onCloseTab]);

  if (tabs.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex items-center bg-card border-b border-border overflow-x-auto scrollbar-none"
    >
        {tabs.map((tab) => (
        <div
          key={tab.path}
          data-tab-path={tab.path}
          onClick={() => onSelectTab(tab.path)}
          onMouseDown={(e) => handleMouseDown(e, tab.path)}
          onContextMenu={(e) => onContextMenu?.(e, tab.path)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-border
            whitespace-nowrap transition-colors cursor-pointer select-none group
            ${activeTab === tab.path
              ? 'bg-background text-foreground border-t-2 border-t-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
            }
          `}
          title={tab.path}
        >
          {tab.isDirty && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
          )}
          <span className="truncate max-w-[120px]">{tab.path.split(/[/\\]/).pop()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.path);
            }}
            className="p-0.5 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-all text-[10px] ml-1 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
