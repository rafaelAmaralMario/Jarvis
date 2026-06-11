import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { LLMProviderInfo, LLMFallbackConfig, JarvisBridge } from '@/types';

const PROVIDER_ICONS: Record<string, string> = {
  ollama: '🦙',
  openai: '🤖',
  anthropic: '✨',
  bedrock: '☁️',
  native: '⚡',
};

export function LLMProvidersPanel() {
  const bridge = useJarvis();
  const [providers, setProviders] = useState<LLMProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState({ apiKey: '', apiUrl: '', defaultModel: '' });
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    setLoading(true);
    try {
      const list = await bridge.llmGetProviders();
      setProviders(list);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSave(provider: string) {
    await bridge.llmSaveProvider({
      provider,
      apiKey: formData.apiKey || undefined,
      apiUrl: formData.apiUrl || undefined,
      defaultModel: formData.defaultModel || undefined,
    });
    setEditingProvider(null);
    loadProviders();
  }

  async function handleTest(provider: string) {
    setTestResult('Testing...');
    const result = await bridge.llmTestConnection(provider);
    setTestResult(result.success ? `Connected! Models: ${(result.models || []).join(', ') || 'none listed'}` : `Error: ${result.error}`);
    setTimeout(() => setTestResult(null), 5000);
  }

  async function handleSetDefault(provider: string) {
    await bridge.llmSetDefaultProvider(provider);
    loadProviders();
  }

  function startEdit(p: LLMProviderInfo) {
    setEditingProvider(p.provider);
    setFormData({ apiKey: '', apiUrl: p.apiUrl, defaultModel: p.defaultModel });
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading providers...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">LLM Providers</h2>
          <p className="text-sm text-muted-foreground">Configure multi-provider AI gateways</p>
        </div>
        <button onClick={loadProviders} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent transition-colors">
          Refresh
        </button>
      </div>
      <div className="grid gap-3">
        {providers.map(p => (
          <motion.div key={p.provider} layout className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PROVIDER_ICONS[p.provider] || '🔌'}</span>
                <div>
                  <div className="font-semibold capitalize">{p.provider}</div>
                  <div className="text-xs text-muted-foreground">{p.apiUrl || 'Default URL'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <button onClick={() => handleTest(p.provider)} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-accent">Test</button>
                <button onClick={() => startEdit(p)} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-accent">Edit</button>
                <button onClick={() => handleSetDefault(p.provider)} className={`px-2 py-1 text-xs rounded-md border ${p.hasKey ? 'border-primary text-primary' : 'border-border hover:bg-accent'}`}>
                  {p.hasKey ? 'Default' : 'Set Default'}
                </button>
              </div>
            </div>
            {p.models.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.models.map(m => (
                  <span key={m} className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground">{m}</span>
                ))}
              </div>
            )}
            {editingProvider === p.provider && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-border space-y-2">
                <input placeholder="API Key" value={formData.apiKey} onChange={e => setFormData(f => ({ ...f, apiKey: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="API URL" value={formData.apiUrl} onChange={e => setFormData(f => ({ ...f, apiUrl: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Default Model" value={formData.defaultModel} onChange={e => setFormData(f => ({ ...f, defaultModel: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <div className="flex gap-2">
                  <button onClick={() => handleSave(p.provider)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
                  <button onClick={() => setEditingProvider(null)} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent">Cancel</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      {testResult && (
        <div className={`p-3 rounded-lg text-xs ${testResult.startsWith('Connected') ? 'bg-green-950/20 text-green-400 border border-green-900/40' : 'bg-blue-950/20 text-blue-400 border border-blue-900/40'}`}>
          {testResult}
        </div>
      )}

      {/* Fallback config */}
      <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
        <h3 className="text-sm font-semibold mb-2">🔄 Fallback Configuration</h3>
        <p className="text-xs text-muted-foreground mb-2">
          When a provider fails, JARVIS automatically tries fallback providers in order. Configure which providers serve as fallback and timeout limits.
        </p>
        <div className="space-y-2">
          {providers.filter(p => p.enabled).map(p => (
            <FallbackRow key={p.provider} provider={p.provider} bridge={bridge} />
          ))}
        </div>
      </div>

      {/* NativeProvider setup guide */}
      <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
        <h3 className="text-sm font-semibold mb-2">⚡ Native Provider Setup</h3>
        <p className="text-xs text-muted-foreground mb-2">
          The Native provider runs GGUF models directly in-process using llama-cpp-python, no external server needed.
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Install: <code className="px-1 py-0.5 rounded bg-muted text-[10px]">pip install jarvis-backend[native]</code></li>
          <li>Set <strong>API URL</strong> to the directory containing your <code className="px-1 py-0.5 rounded bg-muted text-[10px]">.gguf</code> files (e.g. <code className="px-1 py-0.5 rounded bg-muted text-[10px]">C:\models</code>)</li>
          <li>Set <strong>Default Model</strong> to the GGUF filename (e.g. <code className="px-1 py-0.5 rounded bg-muted text-[10px]">llama-3.2-3b.Q4_K_M.gguf</code>)</li>
          <li>Click <strong>Test</strong> to verify the library is installed</li>
          <li>Select <strong>native</strong> in the AiPanel provider dropdown to use it</li>
        </ol>
      </div>
    </div>
  );
}

function FallbackRow({ provider, bridge }: { provider: string; bridge: JarvisBridge }) {
  const [config, setConfig] = useState<LLMFallbackConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const c = await bridge.llmGetFallbackConfig(provider);
      setConfig(c as LLMFallbackConfig | null);
      setLoading(false);
    })();
  }, [provider]);

  if (loading) return <div className="h-8 animate-pulse rounded bg-muted/50" />;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="capitalize w-20 font-medium">{provider}</span>
      <span className="text-muted-foreground">
        {config ? config.fallbackOrder.join(' → ') : 'No fallback configured'}
      </span>
      <button
        onClick={async () => {
          const fallbackOrder = config?.fallbackOrder ?? [];
          const order = prompt(`Fallback order (comma-separated):`, fallbackOrder.join(','));
          if (order === null) return;
          const parsed = order.split(',').map(s => s.trim()).filter(Boolean);
          await bridge.llmSaveFallbackConfig({
            provider,
            fallbackOrder: parsed,
            timeoutSeconds: config?.timeoutSeconds ?? 30,
            modelOverrides: config?.modelOverrides ?? [],
          });
          setConfig({ provider, fallbackOrder: parsed, timeoutSeconds: config?.timeoutSeconds ?? 30, modelOverrides: config?.modelOverrides ?? [] });
        }}
        className="px-2 py-1 text-xs rounded-md border border-border hover:bg-accent"
      >
        Edit
      </button>
    </div>
  );
}
