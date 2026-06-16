import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ActivityBar } from '@/components/ActivityBar';
import { Sidebar } from '@/components/Sidebar';
import { MainArea } from '@/components/MainArea';
import { BottomPanel } from '@/components/BottomPanel/BottomPanel';
import { StatusBar } from '@/components/StatusBar';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { SearchPalette } from '@/components/SearchPalette';
import type { ActivityView } from '@/types';

export function App() {
  const [activeView, setActiveView] = useState<ActivityView>('ai');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [searchOpen, setSearchOpen] = useState(false);

  const commands = [
    { id: 'toggle-terminal', label: 'Toggle Terminal', description: 'Show/hide the terminal panel', action: () => setShowTerminal(v => !v) },
    { id: 'view-ai', label: 'Switch to AI Chat', description: 'Open the AI chat view', action: () => setActiveView('ai') },
    { id: 'view-ide', label: 'Switch to Workspace', description: 'Open the editor/workspace view', action: () => setActiveView('ide') },
    { id: 'view-knowledge', label: 'Switch to Knowledge', description: 'Open the knowledge base view', action: () => setActiveView('knowledge') },
    { id: 'view-git', label: 'Switch to Git', description: 'Open the Git source control view', action: () => setActiveView('git') },
    { id: 'view-settings', label: 'Open Settings', description: 'Open the settings panel', action: () => setActiveView('settings') },
  ];

  const handleSearchOpenFile = useCallback((path: string) => {
    window.dispatchEvent(new CustomEvent('jarvis:open-file', { detail: { path } }));
    setActiveView('editor');
  }, []);

  useEffect(() => {
    const views: ActivityView[] = ['ai', 'knowledge', 'ide', 'git', 'planner', 'automation', 'settings'];
    let viewIndex = views.indexOf(activeView);

    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(v => !v);
      }
    };
    window.addEventListener('keydown', handler);

    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', preventContext);

    const mouseHandler = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (e.button === 3) {
          viewIndex = Math.max(0, viewIndex - 1);
        } else {
          viewIndex = Math.min(views.length - 1, viewIndex + 1);
        }
        setActiveView(views[viewIndex]);
      }
    };
    window.addEventListener('mouseup', mouseHandler);

    const viewHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.view) setActiveView(detail.view as ActivityView);
      if (detail?.message) {
        setActiveView('ai');
      }
    };
    window.addEventListener('jarvis:send-to-chat', viewHandler);

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('contextmenu', preventContext);
      window.removeEventListener('mouseup', mouseHandler);
      window.removeEventListener('jarvis:send-to-chat', viewHandler);
    };
  }, [activeView]);

  return (
    <AppErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-screen flex flex-col bg-background"
      >
        <div className="flex-1 flex overflow-hidden">
          <ActivityBar
            activeView={activeView}
            onViewChange={setActiveView}
          />
          <Sidebar
            activeView={activeView}
            isOpen={true}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <MainArea activeView={activeView} />
            </div>
            {showTerminal && (
              <div
                className="border-t border-border shrink-0"
                style={{ height: terminalHeight }}
              >
                <div
                  className="h-[3px] cursor-n-resize hover:bg-primary/50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startY = e.clientY;
                    const startH = terminalHeight;
                    const onMove = (ev: MouseEvent) => {
                      const newH = startH - (ev.clientY - startY);
                      setTerminalHeight(Math.max(80, Math.min(600, newH)));
                    };
                    const onUp = () => {
                      document.removeEventListener('mousemove', onMove);
                      document.removeEventListener('mouseup', onUp);
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                  }}
                />
                <BottomPanel />
              </div>
            )}
          </div>
        </div>
        <StatusBar />
        <SearchPalette
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onOpenFile={handleSearchOpenFile}
          commands={commands}
        />
      </motion.div>
    </AppErrorBoundary>
  );
}
