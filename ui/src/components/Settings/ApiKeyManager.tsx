import { useState, useEffect, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface ApiKeyEntry {
  service: string;
  key: string;
}

export function ApiKeyManager() {
  const bridge = useJarvis();
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [newService, setNewService] = useState('');
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(true);

  const loadKeys = useCallback(async () => {
    try {
      const list = await bridge.networkListApiKeys();
      setKeys(list);
    } catch {} finally {
      setLoading(false);
    }
  }, [bridge]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleSave = useCallback(async () => {
    if (!newService.trim() || !newKey.trim()) return;
    await bridge.networkStoreApiKey(newService.trim(), newKey.trim());
    setNewService('');
    setNewKey('');
    await loadKeys();
  }, [bridge, newService, newKey, loadKeys]);

  const handleDelete = useCallback(async (service: string) => {
    await bridge.networkDeleteApiKey(service);
    await loadKeys();
  }, [bridge, loadKeys]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Adicionar API Key</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Armazene chaves de API para serviços externos (OpenAI, GitHub, etc.)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newService}
            onChange={e => setNewService(e.target.value)}
            placeholder="Nome do serviço (ex: OPENAI)"
            className="flex-1 text-xs bg-accent/20 border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
          />
          <input
            type="password"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Chave"
            className="flex-1 text-xs bg-accent/20 border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
          />
          <button
            onClick={handleSave}
            disabled={!newService.trim() || !newKey.trim()}
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Chaves armazenadas</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : keys.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma chave armazenada.</p>
        ) : (
          <div className="space-y-1">
            {keys.map(entry => (
              <div
                key={entry.service}
                className="flex items-center gap-2 px-3 py-2 rounded bg-accent/10 border border-border"
              >
                <span className="text-xs font-medium w-40 truncate">{entry.service}</span>
                <span className="text-xs text-muted-foreground flex-1 font-mono">{entry.key}</span>
                <button
                  onClick={() => handleDelete(entry.service)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-1.5 py-0.5 rounded hover:bg-red-900/30"
                >
                  Deletar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
