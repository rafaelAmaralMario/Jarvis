import { useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityBar } from '@/components/ActivityBar';
import { Sidebar } from '@/components/Sidebar';
import { MainArea } from '@/components/MainArea';
import { AiPanel } from '@/components/AiPanel';
import { StatusBar } from '@/components/StatusBar';
import type { ActivityView } from '@/types';

export function App() {
  const [activeView, setActiveView] = useState<ActivityView>('ai');

  return (
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
          moduleCount={3}
        />
        <Sidebar
          activeView={activeView}
          isOpen={true}
        />
        <MainArea activeView={activeView} />
        <AiPanel />
      </div>
      <StatusBar
        moduleCount={3}
        modelName="Ollama qwen2.5-coder"
        activeView={activeView}
      />
    </motion.div>
  );
}
