import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { RouterRule, ProviderMetrics, RouterCacheInfo } from '@/types';

const ALL_PROVIDERS = ['ollama', 'openai', 'anthropic', 'native', 'bedrock'];
const CAPABILITIES = ['chat', 'vision', 'embedding', 'code', 'reasoning'];

export function RouterPanel() {
  const bridge = useJarvis();
  const [rules, setRules] = useState<RouterRule[]>([]);
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [cacheInfo, setCacheInfo] = useState<RouterCacheInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RouterRule | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [r, m, c] = await Promise.all([
        bridge.llmRouterGetRules(),
        bridge.llmRouterGetMetrics(),
        bridge.llmRouterGetCacheInfo(),
      ]);
      setRules(r);
      setMetrics(m);
      setCacheInfo(c);
    } catch {}
    setLoading(false);
  }

  async function handleSave(rule: RouterRule) {
    await bridge.llmRouterSaveRule(rule);
    setShowForm(false);
    setEditing(null);
    await loadAll();
  }

  async function handleDelete(name: string) {
    await bridge.llmRouterDeleteRule(name);
    await loadAll();
  }

  async function handleClearCache() {
    await bridge.llmRouterClearCache();
    await loadAll();
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading router...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">LLM Router</h2>
          <p className="text-sm text-muted-foreground">
            Route requests by model pattern, capability, or provider
          </p>
        </div>
        <button onClick={loadAll} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent transition-colors">
          Refresh
        </button>
      </div>

      {/* Rules */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Routing Rules</h3>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Add Rule
          </button>
        </div>
        {rules.length === 0 && (
          <p className="text-xs text-muted-foreground">No rules configured. Requests use default provider.</p>
        )}
        <div className="grid gap-2">
          {rules.map(r => (
            <motion.div key={r.name} layout className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(r); setShowForm(true); }} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-accent">Edit</button>
                  <button onClick={() => handleDelete(r.name)} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-red-950/20 hover:text-red-400">Delete</button>
                </div>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
                {r.match.byModel.length > 0 && <div>Models: {r.match.byModel.join(', ')}</div>}
                {r.match.byCapability.length > 0 && <div>Capabilities: {r.match.byCapability.join(', ')}</div>}
                {r.match.byProvider.length > 0 && <div>Source providers: {r.match.byProvider.join(', ')}</div>}
                <div>Route to: <span className="text-foreground">{r.providers.join(' → ')}</span></div>
                <div>Priority: {r.priority} · {r.enabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rule form */}
      {showForm && (
        <RuleForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Metrics */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Provider Metrics</h3>
        {metrics.length === 0 && (
          <p className="text-xs text-muted-foreground">No metrics yet.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 pr-3">Provider</th>
                <th className="text-right py-2 pr-3">Calls</th>
                <th className="text-right py-2 pr-3">Success</th>
                <th className="text-right py-2 pr-3">Avg Latency</th>
                <th className="text-right py-2">Last Error</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.provider} className="border-b border-border/50">
                  <td className="py-2 pr-3 capitalize">{m.provider}</td>
                  <td className="py-2 pr-3 text-right">{m.totalCalls}</td>
                  <td className="py-2 pr-3 text-right text-green-400">{m.successCalls}</td>
                  <td className="py-2 pr-3 text-right">{m.avgLatencyMs.toFixed(0)}ms</td>
                  <td className="py-2 text-right text-red-400 truncate max-w-[200px]">{m.lastError || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cache */}
      <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Response Cache</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cacheInfo ? `${cacheInfo.size} / ${cacheInfo.maxSize} entries` : '—'}
            </p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleForm({ initial, onSave, onCancel }: { initial: RouterRule | null; onSave: (r: RouterRule) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [byModel, setByModel] = useState(initial?.match.byModel.join(', ') ?? '');
  const [byCapability, setByCapability] = useState<string[]>(initial?.match.byCapability ?? []);
  const [byProvider, setByProvider] = useState<string[]>(initial?.match.byProvider ?? []);
  const [providers, setProviders] = useState<string[]>(initial?.providers ?? []);
  const [priority, setPriority] = useState(initial?.priority ?? 50);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  function toggleCap(c: string) {
    setByCapability(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function toggleSrcProvider(p: string) {
    setByProvider(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function toggleTargetProvider(p: string) {
    setProviders(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function handleSubmit() {
    onSave({
      name,
      match: {
        byModel: byModel.split(',').map(s => s.trim()).filter(Boolean),
        byCapability,
        byProvider,
        maxCostPer1k: 0,
      },
      providers,
      priority,
      enabled,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border bg-card space-y-3"
    >
      <h3 className="text-sm font-semibold">{initial ? 'Edit Rule' : 'New Rule'}</h3>
      <input
        placeholder="Rule name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <input
        placeholder="Match models (comma-separated regex, e.g. llama.*, gpt-4)"
        value={byModel}
        onChange={e => setByModel(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div>
        <div className="text-xs text-muted-foreground mb-1">Match by capability:</div>
        <div className="flex gap-2 flex-wrap">
          {CAPABILITIES.map(c => (
            <button
              key={c}
              onClick={() => toggleCap(c)}
              className={`px-2 py-1 text-xs rounded-md border ${byCapability.includes(c) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Match source provider:</div>
        <div className="flex gap-2 flex-wrap">
          {ALL_PROVIDERS.map(p => (
            <button
              key={p}
              onClick={() => toggleSrcProvider(p)}
              className={`px-2 py-1 text-xs rounded-md border capitalize ${byProvider.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Route to providers (order matters):</div>
        <div className="flex gap-2 flex-wrap">
          {ALL_PROVIDERS.map(p => (
            <button
              key={p}
              onClick={() => toggleTargetProvider(p)}
              className={`px-2 py-1 text-xs rounded-md border capitalize ${providers.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground">Priority: {priority}</div>
        <input
          type="range"
          min={0}
          max={100}
          value={priority}
          onChange={e => setPriority(Number(e.target.value))}
          className="flex-1"
        />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-3.5 h-3.5 rounded border-border accent-primary" />
        Enabled
      </label>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!name} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
