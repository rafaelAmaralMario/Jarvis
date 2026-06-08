import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { UpdateStatus } from '@/types';

export function UpdatesPanel() {
  const bridge = useJarvis();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [versions, setVersions] = useState<string[]>([]);

  useEffect(() => {
    bridge.getAppVersion().then(() => {
      bridge.checkForUpdates().then(setStatus);
    });
    bridge.getAvailableVersions().then(setVersions);
  }, [bridge]);

  async function handleCheck() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await bridge.checkForUpdates();
      setStatus(result);
      if (!result.update_available) {
        setMessage({ type: 'success', text: 'Você já está na versão mais recente.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Erro ao verificar atualizações: ${err instanceof Error ? err.message : err}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadAndInstall() {
    const v = selectedVersion || status?.latest_version || '';
    if (!v) return;
    setInstalling(true);
    setMessage(null);
    try {
      const result = await bridge.downloadAndInstall(v);
      if (result.success) {
        setMessage({ type: 'success', text: `Versão ${v} baixada! O instalador está em: ${result.path}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Falha ao baixar atualização' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Erro: ${err instanceof Error ? err.message : err}` });
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current version */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Versão Atual</h3>
        <div className="flex items-center gap-3">
          <span className="text-3xl">📦</span>
          <div>
            <p className="text-lg font-bold font-mono">v{status?.current_version || '—'}</p>
            <p className="text-xs text-muted-foreground">JARVIS AI Assistant</p>
          </div>
          {status?.update_available && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30"
            >
              🆕 v{status.latest_version} disponível
            </motion.span>
          )}
        </div>
      </div>

      {/* Check for updates */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheck}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? '⏳ Verificando...' : '🔄 Verificar Atualizações'}
        </motion.button>
        {status?.latest_version && (
          <span className="text-xs text-muted-foreground">
            Última: <span className="font-mono">v{status.latest_version}</span>
          </span>
        )}
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-2 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-950/20 border border-green-900/30 text-green-400'
              : 'bg-red-950/20 border border-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Version selector + install */}
      {versions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Instalar Versão Específica</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedVersion}
              onChange={e => setSelectedVersion(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Selecione uma versão...</option>
              {versions.map(v => (
                <option key={v} value={v}>
                  v{v} {v === status?.latest_version ? '(mais recente)' : ''}
                </option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadAndInstall}
              disabled={installing || !selectedVersion}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              {installing ? '⏳ Baixando...' : '⬇ Baixar & Instalar'}
            </motion.button>
          </div>
        </div>
      )}

      {/* Release history */}
      {status && status.releases && status.releases.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Histórico de Releases</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {status.releases.slice(0, 10).map((rel, i) => (
              <div key={i} className="pb-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium">{rel.tag_name}</span>
                  {rel.prerelease && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      pré-release
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {rel.published_at?.split('T')[0] || ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{rel.name || rel.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
