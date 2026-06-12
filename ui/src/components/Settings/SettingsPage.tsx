import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SettingsTab } from '@/types';
import { ModelsPanel } from './ModelsPanel';
import { AgentsPanel } from './AgentsPanel';
import { OrchestrationPanel } from './OrchestrationPanel';
import { ApiKeyManager } from './ApiKeyManager';
import { LLMProvidersPanel } from './LLMProvidersPanel';
import { MCPServersPanel } from './MCPServersPanel';
import { WorkflowsPanel } from './WorkflowsPanel';
import { SecurityPanel } from './SecurityPanel';
import { UpdatesPanel } from './UpdatesPanel';
import { GeneralPanel } from './GeneralPanel';
import { GGUFSettings } from './GGUFSettings';
import { RouterPanel } from './RouterPanel';
import { ModelClassificationPanel } from './ModelClassificationPanel';

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'models', label: 'Models', icon: '📦' },
  { id: 'gguf', label: 'GGUF', icon: '⬇️' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
  { id: 'orchestration', label: 'Orquestração', icon: '🔀' },
  { id: 'api-keys', label: 'API Keys', icon: '🔑' },
  { id: 'llm-providers', label: 'LLM Providers', icon: '🧠' },
  { id: 'llm-router', label: 'Router', icon: '🔀' },
  { id: 'mcp-servers', label: 'MCP Servers', icon: '🔌' },
  { id: 'workflows', label: 'Workflows', icon: '⚡' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'model-classification', label: 'Classificação', icon: '🏷️' },
  { id: 'general', label: 'Geral', icon: '📋' },
  { id: 'updates', label: 'Atualizações', icon: '🔄' },
];

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('models');

  return (
    <div className="h-full flex overflow-hidden">
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
              {activeTab === 'gguf' && <GGUFSettings />}
              {activeTab === 'agents' && <AgentsPanel />}
              {activeTab === 'orchestration' && <OrchestrationPanel />}
              {activeTab === 'api-keys' && <ApiKeyManager />}
              {activeTab === 'llm-providers' && <LLMProvidersPanel />}
              {activeTab === 'llm-router' && <RouterPanel />}
              {activeTab === 'mcp-servers' && <MCPServersPanel />}
              {activeTab === 'workflows' && <WorkflowsPanel />}
              {activeTab === 'security' && <SecurityPanel />}
              {activeTab === 'model-classification' && <ModelClassificationPanel />}
              {activeTab === 'general' && <GeneralPanel />}
              {activeTab === 'updates' && <UpdatesPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
