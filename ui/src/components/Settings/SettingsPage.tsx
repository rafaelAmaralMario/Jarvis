import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SettingsTab } from '@/types';
import { ModelsPanel } from './ModelsPanel';
import { AgentsPanel } from './AgentsPanel';
import { OrchestrationPanel } from './OrchestrationPanel';

const TABS: { id: SettingsTab; label: string; icon: string; count?: number }[] = [
  { id: 'general', label: 'Geral', icon: '📋' },
  { id: 'models', label: 'Models', icon: '📦', count: 3 },
  { id: 'assistant', label: 'Assistente', icon: '🧠' },
  { id: 'orchestration', label: 'Orquestração', icon: '🔀' },
  { id: 'agents', label: 'Agents', icon: '🤖', count: 2 },
];

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('models');

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-52 border-r border-border bg-sidebar flex-shrink-0 py-3">
        <div className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Settings
        </div>
        <nav className="px-2 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-border bg-sidebar flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {TABS.find(t => t.id === activeTab)?.icon}{' '}
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 animate-pulse" />
            Ollama connected
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
              className="h-full"
            >
              {activeTab === 'models' && <ModelsPanel />}
              {activeTab === 'agents' && <AgentsPanel />}
              {activeTab === 'orchestration' && <OrchestrationPanel />}
              {activeTab === 'general' && (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-4xl mb-4">📋</p>
                  <p>General settings coming soon.</p>
                </div>
              )}
              {activeTab === 'assistant' && (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-4xl mb-4">🧠</p>
                  <p>Assistant preferences coming soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
