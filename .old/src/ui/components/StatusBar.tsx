import { GitBranch, Moon, Shield, Sun } from 'lucide-react';

interface StatusBarProps {
  currentBranch: string;
  activeModelId: string;
  theme: 'dark' | 'light';
  hasWorkspace: boolean;
  allPermissionsOk: boolean;
  onModelClick: () => void;
  onThemeClick: () => void;
  onPermissionsClick: () => void;
}

const providerColor: Record<string, string> = {
  mock: '#8f9bab',
  ollama: '#4a9eff',
  'openai-compatible': '#75d3b5',
};

export function StatusBar({
  currentBranch,
  activeModelId,
  theme,
  hasWorkspace,
  allPermissionsOk,
  onModelClick,
  onThemeClick,
  onPermissionsClick,
}: StatusBarProps) {
  const providerHint = activeModelId.startsWith('ollama:') ? 'ollama'
    : activeModelId.startsWith('mock') ? 'mock'
    : 'openai-compatible';
  const providerBg = providerColor[providerHint] ?? '#8f9bab';

  if (!hasWorkspace) {
    return null;
  }

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-item" title="Branch Git">
          <GitBranch size={14} />
          {currentBranch || 'main'}
        </span>
        <span className="status-item muted">UTF-8</span>
        <span className="status-item muted">Espacos: 2</span>
      </div>
      <div className="status-bar-right">
        <button className="status-item clickable" onClick={onModelClick} title="Modelo ativo" type="button">
          <span className="provider-dot" style={{ background: providerBg }} />
          {activeModelId}
        </button>
        <button className="status-item clickable" onClick={onPermissionsClick} title="Permissoes" type="button">
          <Shield size={14} color={allPermissionsOk ? '#75d3b5' : '#f7c86a'} />
        </button>
        <button className="status-item clickable" onClick={onThemeClick} title="Alternar tema" type="button">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Escuro' : 'Claro'}
        </button>
      </div>
    </div>
  );
}
