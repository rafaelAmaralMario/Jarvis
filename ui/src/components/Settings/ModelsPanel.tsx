import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Specialty, ModelDetail, ModelServerStatus } from '@/types';
import { SPECIALTIES, SPECIALTY_CONFIG } from '@/types';
import { ModelCard } from './ModelCard';
import { useJarvis } from '@/hooks/use-jarvis';

export function ModelsPanel() {
  const bridge = useJarvis();
  const [models, setModels] = useState<ModelDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Specialty | 'all'>('all');
  const [pullInput, setPullInput] = useState('');
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ModelServerStatus | null>(null);
  const [startingServer, setStartingServer] = useState(false);

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      const list = await bridge.listModels();
      setModels(list as any as ModelDetail[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  useEffect(() => { loadModels(); }, [loadModels]);

  useEffect(() => {
    if (serverStatus?.running) {
      loadModels();
    }
  }, [serverStatus?.running, loadModels]);

  useEffect(() => {
    const check = async () => {
      try {
        const status = await bridge.getModelServerStatus();
        setServerStatus(status);
      } catch {}
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [bridge]);

  const filtered = activeTab === 'all'
    ? models
    : models.filter(m => m.specialty === activeTab);

  const grouped = filtered.reduce((acc, m) => {
    const key = m.specialty;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, ModelDetail[]>);

  async function handleStart(name: string) {
    try {
      await bridge.startModel(name);
      setModels(prev => prev.map(m => m.name === name ? { ...m, status: 'running' as const } : m));
    } catch (err) {
      setError(`Erro ao iniciar ${name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function handleStartServer() {
    setStartingServer(true);
    setError(null);
    try {
      await bridge.startModelServer();
      // Wait a moment then re-check
      setTimeout(async () => {
        const status = await bridge.getModelServerStatus();
        setServerStatus(status);
        setStartingServer(false);
      }, 2000);
    } catch (err) {
      setError(`Erro ao iniciar servidor: ${err instanceof Error ? err.message : err}`);
      setStartingServer(false);
    }
  }

  async function handleStop(name: string) {
    try {
      await bridge.stopModel(name);
      setModels(prev => prev.map(m => m.name === name ? { ...m, status: 'stopped' as const } : m));
    } catch (err) {
      setError(`Erro ao parar ${name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function handlePull() {
    const name = pullInput.trim();
    if (!name || pulling) return;
    setPulling(true);
    setError(null);
    try {
      await bridge.pullModel(name);
      setPullInput('');
      const updated = await bridge.listModels();
      setModels(updated as any as ModelDetail[]);
    } catch (err) {
      setError(`Erro ao puxar modelo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setPulling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando modelos...</div>
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

      <div className="flex items-center gap-2 pb-2">
        <span className="text-xs text-muted-foreground font-medium">Provider:</span>
        <span className="px-2 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">🦙 Ollama</span>
      </div>

      <div className="flex gap-2 p-1 rounded-xl border bg-card overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'all' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All <span className="ml-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{models.length}</span>
        </button>
        {SPECIALTIES.map(s => {
          const count = models.filter(m => m.specialty === s).length;
          const cfg = SPECIALTY_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === s ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cfg.icon} {cfg.label}
              {count > 0 && <span className="ml-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={pullInput}
          onChange={(e) => setPullInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePull()}
          placeholder="Pull a model from Ollama registry..."
          disabled={pulling}
          className="flex-1 max-w-sm px-4 py-2 rounded-lg border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
        />
        <motion.button
          whileHover={{ scale: pulling ? 1 : 1.02 }}
          whileTap={{ scale: pulling ? 1 : 0.98 }}
          onClick={handlePull}
          disabled={pulling || !pullInput.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pulling ? '⏳ Pulling...' : '⬇ Pull'}
        </motion.button>
      </div>

      {Object.entries(grouped).map(([specialty, modelList]) => (
        <div key={specialty}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <span className="text-sm">{SPECIALTY_CONFIG[specialty as Specialty]?.icon}</span>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {SPECIALTY_CONFIG[specialty as Specialty]?.label ?? specialty}
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
            {modelList.map((m, i) => (
              <ModelCard
                key={m.name}
                model={m}
                onStart={handleStart}
                onStop={handleStop}
                onSettings={(name) => setError(`Configurações para ${name} em breve`)}
                index={i}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 border border-dashed rounded-xl">
          <p className="text-3xl mb-2">{activeTab !== 'all' ? SPECIALTY_CONFIG[activeTab]?.icon : '📦'}</p>
          <p className="text-sm text-muted-foreground">No {activeTab !== 'all' ? SPECIALTY_CONFIG[activeTab]?.label : ''} models installed.</p>
          <p className="text-xs text-muted-foreground mt-1">Pull one from the Ollama registry above.</p>
        </div>
      )}

      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-xs ${
        serverStatus?.running
          ? 'bg-card border-green-900/30 text-muted-foreground'
          : 'bg-red-950/10 border-red-900/30 text-red-400'
      }`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          serverStatus?.running ? 'bg-green-500 shadow-sm shadow-green-500/60 animate-pulse' : 'bg-red-500'
        }`} />
        <span>
          <strong className={serverStatus?.running ? 'text-green-500' : 'text-red-400'}>
            Ollama {serverStatus?.running ? 'running' : 'stopped'}
          </strong>
          {serverStatus?.running
            ? <span className="text-muted-foreground"> — {serverStatus.command}</span>
            : <span className="text-muted-foreground"> — {serverStatus?.command || 'ollama serve'}</span>
          }
          {serverStatus?.pid && <span className="text-muted-foreground/60 ml-2">PID {serverStatus.pid}</span>}
        </span>
        {!serverStatus?.running && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartServer}
            disabled={startingServer}
            className="ml-auto px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            {startingServer ? '⏳ Iniciando...' : '▶ Iniciar Servidor'}
          </motion.button>
        )}
        {serverStatus?.running && (
          <span className="ml-auto text-muted-foreground/60">
            ▶ Start/■ Stop preloads/releases model memory
          </span>
        )}
      </div>
    </div>
  );
}
