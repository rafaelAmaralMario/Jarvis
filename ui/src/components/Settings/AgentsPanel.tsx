import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, CreateAgentDTO } from '@/types';
import { AgentCard } from './AgentCard';
import { AgentFormDialog } from './AgentFormDialog';
import { AICreationDialog } from './AICreationDialog';
import { useJarvis } from '@/hooks/use-jarvis';

export function AgentsPanel() {
  const bridge = useJarvis();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    bridge.listAgents()
      .then(list => setAgents(list))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [bridge]);

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  async function handleDelete(id: string) {
    try {
      await bridge.deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await bridge.setDefaultAgent(id);
      setAgents(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSave(data: CreateAgentDTO) {
    try {
      if (editingAgent) {
        const updated = await bridge.updateAgent(editingAgent.id, data);
        setAgents(prev => prev.map(a => a.id === editingAgent.id ? updated : a));
      } else {
        const created = await bridge.createAgent(data);
        setAgents(prev => [...prev, created]);
      }
      setDialogOpen(false);
      setEditingAgent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando agentes...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-300">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Configure AI agents for specific tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAiDialogOpen(true)}
            className="px-3 py-2 rounded-lg border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-950/20 transition-colors flex items-center gap-1.5"
          >
            <span>✨</span>
            <span>Criar com IA</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingAgent(null); setDialogOpen(true); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Agent
          </motion.button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(420px,1fr))]">
        <AnimatePresence>
          {agents.map((agent, i) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>

      <AICreationDialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        type="agent"
        onCreated={() => { bridge.listAgents().then(list => setAgents(list)); }}
      />

      <AgentFormDialog
        open={dialogOpen}
        agent={editingAgent}
        models={agents.map(a => a.model).filter((v, i, s) => s.indexOf(v) === i)}
        onClose={() => { setDialogOpen(false); setEditingAgent(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
