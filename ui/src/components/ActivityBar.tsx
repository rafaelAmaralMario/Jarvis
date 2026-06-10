import { motion } from 'framer-motion';
import type { ActivityView } from '@/types';
import { cn } from '@/lib/utils';

const activityItems = [
  { id: 'ai' as ActivityView, icon: '🧠', label: 'Assistente IA' },
  { id: 'knowledge' as ActivityView, icon: '📁', label: 'Conhecimento' },
  { id: 'ide' as ActivityView, icon: '📂', label: 'Workspace' },
  { id: 'editor' as ActivityView, icon: '⌨️', label: 'Editor' },
  { id: 'git' as ActivityView, icon: '⎇', label: 'Git' },
  { id: 'planner' as ActivityView, icon: '📋', label: 'Planner' },
  { id: 'automation' as ActivityView, icon: '⚡', label: 'Automação' },
  { id: 'settings' as ActivityView, icon: '⚙️', label: 'Configurações' },
];

interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <motion.aside
      initial={{ width: 0 }}
      animate={{ width: 48 }}
      className="flex flex-col items-center py-2 gap-1 bg-sidebar border-r border-border"
    >
      {activityItems.map((item, i) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onViewChange(item.id)}
          className={cn(
            'relative flex items-center justify-center w-10 h-10 rounded-lg text-lg transition-colors',
            activeView === item.id
              ? 'bg-sidebar-active text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-muted',
          )}
          title={item.label}
        >
          {item.icon}
          {activeView === item.id && (
            <motion.div
              layoutId="active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </motion.aside>
  );
}
