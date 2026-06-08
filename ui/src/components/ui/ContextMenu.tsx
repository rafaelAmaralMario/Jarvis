import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  children?: ContextMenuItem[];
  onClick: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
}

export function ContextMenu({ state, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    setTimeout(() => {
      window.addEventListener('mousedown', handleClick);
      window.addEventListener('keydown', handleKey);
    }, 0);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const adjustPosition = () => {
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 300;
    return {
      left: Math.min(state.x, maxX),
      top: Math.min(state.y, maxY),
    };
  };

  const pos = adjustPosition();

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[200px] max-w-[280px]"
      style={{ left: pos.left, top: pos.top }}
    >
      {state.items.map((item, i) => {
        if (item.divider) {
          return <div key={i} className="border-t border-border my-1" />;
        }
        return (
          <button
            key={item.id}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`
              w-full text-left px-3 py-1.5 text-xs flex items-center gap-2
              transition-colors
              ${item.disabled
                ? 'text-muted-foreground/40 cursor-not-allowed'
                : item.danger
                  ? 'text-red-400 hover:bg-red-500/20'
                  : 'text-foreground hover:bg-accent/30'
              }
            `}
          >
            {item.icon && <span className="w-4 text-center flex-shrink-0">{item.icon}</span>}
            <span className="flex-1 truncate">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
