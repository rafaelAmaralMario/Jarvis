import { lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityView } from '@/types';

const SettingsPage = lazy(() => import('@/components/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const KnowledgePanel = lazy(() => import('@/components/Knowledge/KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const WorkspacePanel = lazy(() => import('@/components/Workspace/WorkspacePanel').then(m => ({ default: m.WorkspacePanel })));

interface MainAreaProps {
  activeView: ActivityView;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function MainArea({ activeView }: MainAreaProps) {
  if (activeView === 'settings') {
    return <SettingsPage />;
  }

  if (activeView === 'knowledge') {
    return <KnowledgePanel />;
  }

  if (activeView === 'ide') {
    return <WorkspacePanel />;
  }

  if (activeView === 'ai') {
    return (
      <motion.main
        layout
        className="flex-1 flex items-center justify-center bg-background"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={spring}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-6xl mb-4"
            >
              🧠
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">JARVIS</h1>
            <p className="text-muted-foreground">Assistente IA Multi-Agent</p>
          </motion.div>
        </AnimatePresence>
      </motion.main>
    );
  }

  return null;
}
