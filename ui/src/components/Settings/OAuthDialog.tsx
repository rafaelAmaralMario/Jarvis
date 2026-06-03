import { useState, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface OAuthDialogProps {
  isOpen: boolean;
}

export function OAuthDialog({ isOpen }: OAuthDialogProps) {
  const bridge = useJarvis();
  const [status, setStatus] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleGitHub = useCallback(async () => {
    setStatus('Abrindo GitHub para autorização...');
    try {
      const url = await bridge.networkOAuthStart('github');
      if (!url) {
        setStatus('Configure GITHUB_CLIENT_ID via API Keys primeiro.');
        return;
      }
      window.open(url, '_blank', 'width=600,height=700');
      setStatus('Autorize no GitHub e cole o código de callback abaixo:');
    } catch {
      setStatus('Erro ao iniciar OAuth.');
    }
  }, [bridge]);

  const handleComplete = useCallback(async () => {
    if (!token) return;
    setStatus('Trocando código por token...');
    try {
      const result = await bridge.networkOAuthComplete('github', token);
      if (result) {
        setStatus('✅ Autenticado com sucesso!');
      } else {
        setStatus('❌ Falha na autenticação.');
      }
    } catch {
      setStatus('❌ Erro ao completar OAuth.');
    }
  }, [bridge, token]);

  const handleClear = useCallback(async () => {
    await bridge.networkClearToken('github');
    setStatus('Token removido.');
    setToken(null);
  }, [bridge]);

  if (!isOpen) return null;

  return (
    <div className="mt-4 p-4 border border-border rounded-lg bg-accent/5">
      <h4 className="text-sm font-medium mb-3">Conexões OAuth</h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">GitHub</p>
            <p className="text-[10px] text-muted-foreground">Acesso a repositórios, push via Git</p>
          </div>
          <button
            onClick={handleGitHub}
            className="px-3 py-1.5 text-xs rounded bg-[#2dba4e] text-white hover:bg-[#24963e] transition-colors"
          >
            Conectar GitHub
          </button>
        </div>

        {status && (
          <div className="text-xs text-muted-foreground bg-accent/10 rounded p-2">
            <p>{status}</p>
            {status.includes('cole o código') && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={token || ''}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Código de autorização"
                  className="flex-1 text-xs bg-accent/20 border border-border rounded px-2 py-1 outline-none"
                />
                <button
                  onClick={handleComplete}
                  disabled={!token}
                  className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground disabled:opacity-50 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            )}
            {status.includes('sucesso') && (
              <button
                onClick={handleClear}
                className="mt-2 px-2 py-1 text-xs rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
