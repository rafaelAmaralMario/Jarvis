import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { OrchestrationConfig, Agent } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export function OrchestrationPanel() {
  const bridge = useJarvis();
  const [config, setConfig] = useState<OrchestrationConfig>({
    enabled: true,
    orchestratorModel: 'llama3.2:3b',
    criticEnabled: true,
    criticTemperature: 0.1,
    maxAgentsPerQuery: 3,
    showTrace: true,
  });
  const [pool, setPool] = useState<Agent[]>([]);
  const [poolEnabled, setPoolEnabled] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      bridge.getOrchestrationConfig(),
      bridge.getOrchestrationPool(),
    ])
      .then(([cfg, poolList]) => {
        setConfig(cfg);
        setPool(poolList);
        setPoolEnabled(Object.fromEntries(poolList.map(a => [a.id, true])));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [bridge]);

  const togglePoolEnabled = (id: string) => {
    setPoolEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await bridge.updateOrchestrationConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando configuração de orquestração...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-300">✕</button>
        </div>
      )}

      <div>
        <p className="text-sm text-muted-foreground">
          Configure how JARVIS orchestrates multiple specialist agents to produce the best final response.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="space-y-6"
      >
        {/* Master toggle */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>🔀</span> Multi-Agent Mode
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, JARVIS routes your query to the best specialist agents automatically.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-green-600/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-green-500 after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm" />
            </label>
          </div>
        </div>

        {/* Orchestrator config */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span>🎯</span> Orchestrator Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Router Model</label>
              <select
                value={config.orchestratorModel}
                onChange={(e) => setConfig({ ...config, orchestratorModel: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="llama3.2:3b">llama3.2:3b</option>
                <option value="codellama:7b">codellama:7b</option>
                <option value="">Use default</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Max Agents per Query</label>
              <input
                type="number"
                min="1"
                max="5"
                value={config.maxAgentsPerQuery}
                onChange={(e) => setConfig({ ...config, maxAgentsPerQuery: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Critic config */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span>✅</span> Critic Agent
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.criticEnabled}
                onChange={(e) => setConfig({ ...config, criticEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-purple-600/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-purple-500 after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm" />
            </label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Reviews and approves the final response. Uses low temperature (0.1) for objective evaluation.
          </p>
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Critic Temperature</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.criticTemperature}
              onChange={(e) => setConfig({ ...config, criticTemperature: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Agent pool */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span>👥</span> Agent Pool
          </h3>
          <p className="text-xs text-muted-foreground -mt-2">
            Select which agents are available for orchestration. Higher priority agents are preferred.
          </p>
          <div className="space-y-2">
            {pool.map((agent) => (
              <label
                key={agent.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-background cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={poolEnabled[agent.id] ?? false}
                  onChange={() => togglePoolEnabled(agent.id)}
                  className="rounded"
                />
                <span className="flex-1 text-sm font-medium">{agent.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  priority {agent.priority}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {agent.specialty}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Display config */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>👁</span> Show Agent Trace
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Display which agents were consulted in the response.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTrace}
                onChange={(e) => setConfig({ ...config, showTrace: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-blue-600/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-blue-500 after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm" />
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? '⏳ Saving...' : saved ? '✅ Saved' : 'Save Configuration'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
