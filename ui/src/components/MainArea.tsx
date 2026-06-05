import { lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityView } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';
import { GitPanel } from '@/components/Git/GitPanel';

const SettingsPage = lazy(() => import('@/components/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const KnowledgePanel = lazy(() => import('@/components/Knowledge/KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const WorkspacePanel = lazy(() => import('@/components/Workspace/WorkspacePanel').then(m => ({ default: m.WorkspacePanel })));
const EditorPanel = lazy(() => import('@/components/Editor/EditorPanel').then(m => ({ default: m.EditorPanel })));

interface MainAreaProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function MainArea({ activeView, onViewChange }: MainAreaProps) {
  const jarvis = useJarvis();
  const [fileToOpen, setFileToOpen] = useState<string | undefined>();
  const [gitRepoPath, setGitRepoPath] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const roots = await jarvis.getRoots();
        if (roots.length > 0) {
          const isRepo = await jarvis.gitIsRepo(roots[0]);
          setGitRepoPath(isRepo ? roots[0] : '');
        }
      } catch {}
    })();
  }, []);

  if (activeView === 'git' && gitRepoPath) {
    return <GitPanel repoPath={gitRepoPath} />;
  }

  if (activeView === 'git' && !gitRepoPath) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-4xl mb-3">⎇</p>
          <p className="text-sm">No git repository in current workspace</p>
          <p className="text-xs mt-1">Open a git repo in the Workspace view first</p>
        </div>
      </div>
    );
  }

  if (activeView === 'settings') {
    return <SettingsPage />;
  }

  if (activeView === 'knowledge') {
    return <KnowledgePanel />;
  }

  if (activeView === 'ide') {
    return <WorkspacePanel onOpenInEditor={handleOpenInEditor} />;
  }

  if (activeView === 'editor') {
    return <EditorPanel fileToOpen={fileToOpen} />;
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

  function handleOpenInEditor(path: string) {
    setFileToOpen(path);
    onViewChange('editor');
  }
}
