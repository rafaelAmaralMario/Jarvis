import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Bot,
  Boxes,
  CheckCircle2,
  Code2,
  File,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  GitBranch,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { appMetadata } from '../application';
import { defaultModelId, models } from '../application/model-registry';
import { mockTextProvider } from '../infrastructure/mock-provider';
import {
  createFile,
  createFolder,
  deleteEntry,
  getDefaultWorkspacePath,
  getGitDiff,
  getGitStatus,
  listMarkdownNotes,
  listWorkspaceEntries,
  readTextFile,
  selectWorkspaceFolder,
  validatePath,
  writeTextFile,
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
  workspacePath: string;
  theme: 'dark' | 'light';
}

const settingsKey = 'jarvis.settings.v1';

const defaultSettings: SettingsState = {
  selectedModelId: defaultModelId,
  vaultPath: '',
  workspacePath: '',
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
  const [selectedEntry, setSelectedEntry] = useState<WorkspaceEntry | null>(null);
  const [gitFiles, setGitFiles] = useState<GitFileStatus[]>([]);
  const [selectedGitFile, setSelectedGitFile] = useState<string>('');
  const [diff, setDiff] = useState('');
  const [activeFilePath, setActiveFilePath] = useState('welcome.ts');
  const [activeFileContent, setActiveFileContent] = useState(sampleCode);
  const [activeLanguage, setActiveLanguage] = useState('typescript');
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
    const path = settings.workspacePath || (await getDefaultWorkspacePath());
    setWorkspacePath(path);
    setSettings((current) => ({ ...current, workspacePath: path }));
    await refreshWorkspace(path);
  }

  async function refreshWorkspace(path = workspacePath) {
    const [workspaceEntries, status] = await Promise.all([
      listWorkspaceEntries(path),
      getGitStatus(path),
    ]);
    setFiles(workspaceEntries);
    setGitFiles(status);
    setSelectedEntry(null);
    addLog(`Workspace atualizado: ${path}`, 'ok');
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

  async function chooseWorkspace() {
    const selected = await selectWorkspaceFolder();
    if (!selected) {
      return;
    }

    setWorkspacePath(selected);
    setSettings((current) => ({ ...current, workspacePath: selected }));
    await refreshWorkspace(selected);
  }

  async function openWorkspaceFile(file: WorkspaceEntry) {
    setSelectedEntry(file);
    if (file.kind === 'directory') {
      return;
    }

    try {
      const result = await readTextFile(workspacePath, file.path);
      setActiveFilePath(result.path);
      setActiveFileContent(result.content);
      setActiveLanguage(languageFromPath(result.path));
      addLog(`Arquivo aberto: ${file.name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createWorkspaceFile() {
    const name = window.prompt('Nome do novo arquivo');
    if (!name) {
      return;
    }

    try {
      await createFile(workspacePath, parentForNewEntry(), name);
      await refreshWorkspace();
      addLog(`Arquivo criado: ${name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createWorkspaceFolder() {
    const name = window.prompt('Nome da nova pasta');
    if (!name) {
      return;
    }

    try {
      await createFolder(workspacePath, parentForNewEntry(), name);
      await refreshWorkspace();
      addLog(`Pasta criada: ${name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function deleteSelectedEntry() {
    if (!selectedEntry) {
      addLog('Selecione um arquivo ou pasta para remover', 'warn');
      return;
    }

    const confirmed = window.confirm(`Remover "${selectedEntry.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteEntry(workspacePath, selectedEntry.path);
      if (activeFilePath === selectedEntry.path) {
        setActiveFilePath('welcome.ts');
        setActiveFileContent(sampleCode);
        setActiveLanguage('typescript');
      }
      await refreshWorkspace();
      addLog(`Removido: ${selectedEntry.name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function saveActiveFile() {
    if (activeFilePath === 'welcome.ts') {
      addLog('Abra um arquivo do workspace antes de salvar', 'warn');
      return;
    }

    try {
      await writeTextFile(workspacePath, activeFilePath, activeFileContent);
      await refreshWorkspace();
      addLog(`Arquivo salvo: ${shortPath(activeFilePath)}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function parentForNewEntry() {
    return selectedEntry?.kind === 'directory' ? selectedEntry.path : workspacePath;
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
        <span className="activity-logo">
          <Sparkles size={17} />
        </span>
        {activityItems.map((item) => (
          <button
            className={activeView === item.id ? 'activity-button active' : 'activity-button'}
            key={item.id}
            onClick={() => setActiveView(item.id)}
            title={item.label}
            type="button"
          >
            <item.Icon size={17} />
          </button>
        ))}
      </aside>

      <section className="sidebar" aria-label="Painel lateral">
        <header className="panel-header">{sidebarTitle[activeView]}</header>
        {activeView === 'files' && (
          <div className="panel-list">
            <div className="toolbar">
              <button className="icon-button" onClick={() => void chooseWorkspace()} title="Abrir pasta" type="button">
                <FolderOpen size={16} />
              </button>
              <button className="icon-button" onClick={() => void createWorkspaceFile()} title="Criar arquivo" type="button">
                <FilePlus2 size={16} />
              </button>
              <button className="icon-button" onClick={() => void createWorkspaceFolder()} title="Criar pasta" type="button">
                <FolderPlus size={16} />
              </button>
              <button className="icon-button danger" onClick={() => void deleteSelectedEntry()} title="Remover selecionado" type="button">
                <Trash2 size={16} />
              </button>
            <button className="icon-button" onClick={() => void refreshWorkspace()} title="Atualizar" type="button">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="workspace-path">{workspacePath}</div>
            {files.map((file) => (
              <button
                className={selectedEntry?.path === file.path ? 'list-row button-row selected' : 'list-row button-row'}
                key={file.path}
                onClick={() => void openWorkspaceFile(file)}
                type="button"
              >
                {file.kind === 'directory' ? <Folder size={15} /> : <File size={15} />}
                {file.name}
              </button>
            ))}
          </div>
        )}
        {activeView === 'git' && (
          <div className="panel-list">
            <button className="text-button with-icon" onClick={() => void refreshWorkspace()} type="button">
              <RefreshCw size={15} />
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
              Projeto atual
              <input value={workspacePath} readOnly />
            </label>
            <button className="primary-button with-icon" onClick={() => void chooseWorkspace()} type="button">
              <FolderOpen size={15} />
              Selecionar pasta do projeto
            </button>
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
          <span className="tab active">{shortPath(activeFilePath)}</span>
          <span className="tab">proposal.diff</span>
          <button className="tab-action" onClick={() => void saveActiveFile()} title="Salvar arquivo" type="button">
            <Save size={15} />
            Salvar
          </button>
        </div>
        <div className="editor-frame">
          <Editor
            language={activeLanguage}
            height="100%"
            theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
            value={activeFileContent}
            onChange={(value) => setActiveFileContent(value ?? '')}
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
                <CheckCircle2 size={15} />
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
          <button className="primary-button with-icon" onClick={() => void sendMessage()} type="button">
            <Sparkles size={15} />
            Enviar
          </button>
        </div>
      </aside>
    </main>
  );
}

const activityItems: Array<{ id: ActivityView; label: string; Icon: typeof Folder }> = [
  { id: 'files', label: 'Arquivos', Icon: Folder },
  { id: 'git', label: 'Git', Icon: GitBranch },
  { id: 'settings', label: 'Configuracoes', Icon: Settings },
  { id: 'plugins', label: 'Plugins', Icon: Boxes },
  { id: 'context', label: 'Contexto', Icon: Code2 },
  { id: 'agents', label: 'Agentes', Icon: Bot },
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

function shortPath(path: string) {
  return path.split(/[\\/]/).pop() || path;
}

function languageFromPath(path: string) {
  const extension = path.split('.').pop()?.toLowerCase();
  const languageByExtension: Record<string, string> = {
    css: 'css',
    html: 'html',
    js: 'javascript',
    json: 'json',
    md: 'markdown',
    rs: 'rust',
    ts: 'typescript',
    tsx: 'typescript',
  };

  return extension ? (languageByExtension[extension] ?? 'plaintext') : 'plaintext';
}
