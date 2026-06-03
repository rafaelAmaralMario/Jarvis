import { motion } from 'framer-motion';
import type { ActivityView } from '@/types';
import { SearchBar } from '@/components/Knowledge/SearchBar';

interface SidebarProps {
  activeView: ActivityView;
  isOpen: boolean;
}

const viewTitles: Record<ActivityView, string> = {
  knowledge: 'Conhecimento',
  ide: 'IDE',
  editor: 'Editor',
  ai: 'Assistente IA',
  automation: 'Automação',
  settings: 'Configurações',
};

export function Sidebar({ activeView, isOpen }: SidebarProps) {
  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{
        width: isOpen ? 260 : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="overflow-hidden bg-card border-r border-border"
    >
      <div className="p-4 w-[260px]">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4"
        >
          {viewTitles[activeView]}
        </motion.h2>
        <div className="text-muted-foreground text-sm">
          {activeView === 'knowledge' && (
            <div className="space-y-2">
              <SearchBar onSelectNote={() => {}} />
              <div className="space-y-1 mt-4 text-xs text-muted-foreground/50 text-center">
                Select a note to see details
              </div>
            </div>
          )}
          {activeView === 'ide' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground/50 text-center">
                File explorer is in the main panel.
              </p>
              <p className="text-[10px] text-muted-foreground/40 text-center">
                Open a folder from the IDE view to browse files.
              </p>
            </div>
          )}
          {activeView === 'ai' && <p>Conversas recentes</p>}
        </div>
      </div>
    </motion.aside>
  );
}
