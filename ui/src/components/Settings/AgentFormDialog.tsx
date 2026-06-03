import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, CreateAgentDTO } from '@/types';

interface AgentFormDialogProps {
  open: boolean;
  agent: Agent | null;
  models: string[];
  onClose: () => void;
  onSave: (data: CreateAgentDTO) => void;
}

export function AgentFormDialog({ open, agent, models, onClose, onSave }: AgentFormDialogProps) {
  const [form, setForm] = useState<CreateAgentDTO>({
    name: '',
    description: '',
    model: 'llama3.2:3b',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
    specialty: 'general',
    tools: [],
    canOrchestrate: true,
    priority: 5,
  });

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name,
        description: agent.description,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        specialty: agent.specialty,
        tools: agent.tools,
        canOrchestrate: agent.canOrchestrate,
        priority: agent.priority,
      });
    } else {
      setForm({
        name: '',
        description: '',
        model: 'llama3.2:3b',
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 2048,
        specialty: 'general',
        tools: [],
        canOrchestrate: true,
        priority: 5,
      });
    }
  }, [agent, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-card border border-border rounded-2xl p-8 w-full max-w-lg shadow-2xl"
          >
            <h2 className="text-lg font-bold mb-1">{agent ? '✎ Edit Agent' : '🤖 New Agent'}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {agent ? 'Configure the agent settings below.' : 'Create a new AI agent for a specific task.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Agent name"
                    required
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What does this agent do?"
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Model</label>
                  <select
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {(models.length > 0 ? models : ['llama3.2:3b']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Specialty</label>
                  <select
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="general">🤖 General</option>
                    <option value="chat">💬 Chat</option>
                    <option value="code">💻 Code</option>
                    <option value="reasoning">🧠 Reasoning</option>
                    <option value="embedding">📐 Embedding</option>
                    <option value="vision">👁 Vision</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">System Prompt</label>
                  <textarea
                    value={form.systemPrompt}
                    onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                    placeholder="You are a helpful AI assistant..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Temperature (0.0 – 2.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxTokens}
                    onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Multi-Agent Pool</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.canOrchestrate}
                      onChange={(e) => setForm({ ...form, canOrchestrate: e.target.checked })}
                      className="rounded"
                    />
                    Available for orchestration
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Priority (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {agent ? 'Save Changes' : 'Create Agent'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
