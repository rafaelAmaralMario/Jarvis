import { motion, AnimatePresence } from 'framer-motion';

interface FileTab {
  path: string;
  name: string;
}

interface FileTabsProps {
  tabs: FileTab[];
  activeTab: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export function FileTabs({ tabs, activeTab, onSelectTab, onCloseTab }: FileTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-card border-b border-border overflow-x-auto">
      <AnimatePresence>
        {tabs.map((tab) => (
          <motion.button
            key={tab.path}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            onClick={() => onSelectTab(tab.path)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border whitespace-nowrap transition-colors group ${
              activeTab === tab.path
                ? 'bg-background text-foreground border-t-2 border-t-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
            }`}
          >
            <span>{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.path);
              }}
              className="p-0.5 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-all text-[10px]"
            >
              ✕
            </button>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
