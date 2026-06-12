import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ActivityBar } from '@/components/ActivityBar';
import { Sidebar } from '@/components/Sidebar';
import { MainArea } from '@/components/MainArea';
import { TerminalPanel } from '@/components/Terminal/TerminalPanel';
import { StatusBar } from '@/components/StatusBar';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import type { ActivityView } from '@/types';

export function App() {
  const [activeView, setActiveView] = useState<ActivityView>('ai');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
      window.removeEventListener('jarvis:send-to-chat', viewHandler);
    };
  }, []);

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
                <TerminalPanel />
              </div>
            )}
          </div>
        </div>
        <StatusBar
          moduleCount={3}
          modelName="Ollama qwen2.5-coder"
        />
      </motion.div>
    </AppErrorBoundary>
  );
}
