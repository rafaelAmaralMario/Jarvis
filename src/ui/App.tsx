import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';

import { appMetadata } from '../application';
import { defaultModelId, models } from '../application/model-registry';
import { mockTextProvider } from '../infrastructure/mock-provider';
import {
  getDefaultWorkspacePath,
  getGitDiff,
  getGitStatus,
  listMarkdownNotes,
  listWorkspaceEntries,
  validatePath,
  type GitFileStatus,
  type MarkdownNote,
  type WorkspaceEntry,
} from '../infrastructure/native';
import { pluginManifests } from '../plugins/manifests';

type ActivityView = 'files' | 'git' | 'settings' | 'plugins' | 'context' | 'agents';
type BottomView = 'terminal' | 'logs' | 'diff' | 'proposal';
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ActionLog = { id: string; message: string; status: 'ok' | 'warn' };

interface SettingsState {
  selectedModelId: string;
  vaultPath: string;
  theme: 'dark' | 'light';
}

const settingsKey = 'jarvis.settings.v1';

const defaultSettings: SettingsState = {
  selectedModelId: defaultModelId,
  vaultPath: '',
  theme: 'dark',
};

function loadSettings(): SettingsState {
  const stored = localStorage.getItem(settingsKey);
  if (!stored) {
    return defaultSettings;
  }

  try {
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
}

export function App() {
  const [activeView, setActiveView] = useState<ActivityView>('files');
  const [bottomView, setBottomView] = useState<BottomView>('logs');
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [workspacePath, setWorkspacePath] = useState('');
  const [files, setFiles] = useState<WorkspaceEntry[]>([]);
  const [gitFiles, setGitFiles] = useState<GitFileStatus[]>([]);
  const [selectedGitFile, setSelectedGitFile] = useState<string>('');
  const [diff, setDiff] = useState('');
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [proposalAccepted, setProposalAccepted] = useState(false);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === settings.selectedModelId) ?? models[0],
    [settings.selectedModelId],
  );

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    void initializeWorkspace();
  }, []);

  async function initializeWorkspace() {
    const path = await getDefaultWorkspacePath();
    setWorkspacePath(path);
    await refreshWorkspace(path);
  }

  async function refreshWorkspace(path = workspacePath) {
    const [workspaceEntries, status] = await Promise.all([
      listWorkspaceEntries(path),
      getGitStatus(path),
    ]);
    setFiles(workspaceEntries);
    setGitFiles(status);
    addLog('Workspace atualizado', 'ok');
  }

  function addLog(message: string, status: ActionLog['status'] = 'ok') {
    setLogs((current) => [
      { id: crypto.randomUUID(), message, status },
      ...current.slice(0, 24),
    ]);
  }

  async function sendMessage() {
    const input = chatInput.trim();
    if (!input) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', content: input }]);
    setChatInput('');
    const response = await mockTextProvider.sendMessage(input);
    setMessages((current) => [...current, { role: 'assistant', content: response }]);
    addLog(`Chat respondido por ${mockTextProvider.name}`, 'ok');
  }

  async function openDiff(filePath: string) {
    setSelectedGitFile(filePath);
    setBottomView('diff');
    const result = await getGitDiff(workspacePath, filePath);
    setDiff(result || 'Sem diff textual disponivel para este arquivo.');
    addLog(`Diff carregado: ${filePath}`, 'ok');
  }

  async function loadObsidianNotes() {
    if (!settings.vaultPath.trim()) {
      addLog('Informe o caminho do vault do Obsidian', 'warn');
      return;
    }

    const exists = await validatePath(settings.vaultPath);
    if (!exists) {
      addLog('Vault do Obsidian nao encontrado', 'warn');
      return;
    }

    const markdownNotes = await listMarkdownNotes(settings.vaultPath);
    setNotes(markdownNotes);
    addLog(`${markdownNotes.length} notas Markdown carregadas`, 'ok');
  }

  function acceptProposal() {
    setProposalAccepted(true);
    addLog('Proposta mockada aceita para validacao do fluxo', 'ok');
  }

  return (
    <main className={`app-shell theme-${settings.theme}`}>
      <aside className="activity-bar" aria-label="Navegacao principal">
        <span className="activity-logo">J</span>
        {activityItems.map((item) => (
          <button
            className={activeView === item.id ? 'activity-button active' : 'activity-button'}
            key={item.id}
            onClick={() => setActiveView(item.id)}
            title={item.label}
            type="button"
          >
            {item.icon}
          </button>
        ))}
      </aside>

      <section className="sidebar" aria-label="Painel lateral">
        <header className="panel-header">{sidebarTitle[activeView]}</header>
        {activeView === 'files' && (
          <div className="panel-list">
            <div className="workspace-path">{workspacePath}</div>
            {files.map((file) => (
              <div className="list-row" key={file.path}>
                <span>{file.kind === 'directory' ? '[]' : '{}'}</span>
                {file.name}
              </div>
            ))}
          </div>
        )}
        {activeView === 'git' && (
          <div className="panel-list">
            <button className="text-button" onClick={() => void refreshWorkspace()} type="button">
              Atualizar status
            </button>
            {gitFiles.length === 0 && <div className="empty-state">Nenhuma mudanca Git.</div>}
            {gitFiles.map((file) => (
              <button
                className="list-row button-row"
                key={file.path}
                onClick={() => void openDiff(file.path)}
                type="button"
              >
                <span className="status-pill">{file.status || '??'}</span>
                {file.path}
              </button>
            ))}
          </div>
        )}
        {activeView === 'settings' && (
          <div className="settings-panel">
            <label>
              Modelo padrao
              <select
                value={settings.selectedModelId}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, selectedModelId: event.target.value }))
                }
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tema
              <select
                value={settings.theme}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    theme: event.target.value as SettingsState['theme'],
                  }))
                }
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </label>
            <label>
              Vault Obsidian
              <input
                value={settings.vaultPath}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, vaultPath: event.target.value }))
                }
                placeholder="C:\\Users\\...\\Vault"
              />
            </label>
            <button className="primary-button" onClick={() => void loadObsidianNotes()} type="button">
              Validar e carregar notas
            </button>
          </div>
        )}
        {activeView === 'plugins' && (
          <div className="panel-list">
            {pluginManifests.map((plugin) => (
              <article className="plugin-card" key={plugin.id}>
                <div>
                  <strong>{plugin.name}</strong>
                  <span>{plugin.version}</span>
                </div>
                <p>{plugin.capabilities.join(', ')}</p>
                <small>Permissoes: {plugin.permissions.join(', ') || 'nenhuma'}</small>
              </article>
            ))}
          </div>
        )}
        {activeView === 'context' && (
          <div className="panel-list">
            {notes.length === 0 && <div className="empty-state">Nenhuma nota carregada.</div>}
            {notes.map((note) => (
              <div className="list-row" key={note.path}>
                <span>MD</span>
                {note.title}
              </div>
            ))}
          </div>
        )}
        {activeView === 'agents' && (
          <div className="panel-list">
            {['Desenvolvedor', 'Revisor', 'Documentador'].map((agent) => (
              <article className="plugin-card" key={agent}>
                <strong>Agente {agent}</strong>
                <p>Modo assistido, sem execucao sensivel automatica.</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workbench" aria-label="Editor">
        <div className="top-bar">
          <div>
            <strong>{appMetadata.name}</strong>
            <span>{appMetadata.description}</span>
          </div>
          <div className="model-badge">{selectedModel.name}</div>
        </div>
        <div className="editor-tabs">
          <span className="tab active">welcome.ts</span>
          <span className="tab">proposal.diff</span>
        </div>
        <div className="editor-frame">
          <Editor
            defaultLanguage="typescript"
            height="100%"
            theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
            value={sampleCode}
            options={{ minimap: { enabled: false }, fontSize: 14, readOnly: false }}
          />
        </div>
        <section className="bottom-panel">
          <nav>
            {(['logs', 'diff', 'proposal', 'terminal'] as BottomView[]).map((view) => (
              <button
                className={bottomView === view ? 'bottom-tab active' : 'bottom-tab'}
                key={view}
                onClick={() => setBottomView(view)}
                type="button"
              >
                {bottomLabels[view]}
              </button>
            ))}
          </nav>
          {bottomView === 'logs' && (
            <div className="bottom-content">
              {logs.map((log) => (
                <div className={`log-row ${log.status}`} key={log.id}>
                  {log.message}
                </div>
              ))}
            </div>
          )}
          {bottomView === 'diff' && <pre className="diff-view">{diff || selectedGitFile}</pre>}
          {bottomView === 'proposal' && (
            <div className="proposal">
              <strong>Proposta de alteracao mockada</strong>
              <p>Adicionar provider mockado mantendo contrato substituivel.</p>
              <button className="primary-button" onClick={acceptProposal} type="button">
                Aceitar proposta
              </button>
              {proposalAccepted && <span className="accepted">Proposta aceita.</span>}
            </div>
          )}
          {bottomView === 'terminal' && (
            <pre className="terminal-view">npm run tauri -- dev</pre>
          )}
        </section>
      </section>

      <aside className="ai-panel" aria-label="Painel de IA">
        <header className="panel-header">IA</header>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">Envie uma mensagem para testar o provider mockado.</div>
          )}
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              <strong>{message.role === 'user' ? 'Voce' : 'JARVIS'}</strong>
              <p>{message.content}</p>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Peca algo ao JARVIS..."
          />
          <button className="primary-button" onClick={() => void sendMessage()} type="button">
            Enviar
          </button>
        </div>
      </aside>
    </main>
  );
}

const activityItems: Array<{ id: ActivityView; label: string; icon: string }> = [
  { id: 'files', label: 'Arquivos', icon: 'F' },
  { id: 'git', label: 'Git', icon: 'G' },
  { id: 'settings', label: 'Configuracoes', icon: 'S' },
  { id: 'plugins', label: 'Plugins', icon: 'P' },
  { id: 'context', label: 'Contexto', icon: 'C' },
  { id: 'agents', label: 'Agentes', icon: 'A' },
];

const sidebarTitle: Record<ActivityView, string> = {
  files: 'Arquivos',
  git: 'Git',
  settings: 'Configuracoes',
  plugins: 'Plugins',
  context: 'Contexto',
  agents: 'Agentes',
};

const bottomLabels: Record<BottomView, string> = {
  terminal: 'Terminal',
  logs: 'Logs',
  diff: 'Diff',
  proposal: 'Proposta',
};

const sampleCode = `import type { TextModelProvider } from './domain';

export const provider: TextModelProvider = {
  id: 'mock',
  name: 'Mock Provider',
  async sendMessage(input) {
    return \`Resposta simulada para: \${input}\`;
  },
};
`;
