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
  Pencil,
  GitBranch,
  MoveRight,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Trash2,
  type LucideIcon,
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
  moveEntry,
  readTextFile,
  renameEntry,
  searchWorkspace,
  selectWorkspaceFolder,
  validatePath,
  writeTextFile,
  type GitFileStatus,
  type MarkdownNote,
  type SearchResult,
  type WorkspaceEntry,
} from '../infrastructure/native';
import { pluginManifests } from '../plugins/manifests';

type ActivityView = 'files' | 'git' | 'search' | 'settings' | 'plugins' | 'context' | 'agents';
type BottomView = 'terminal' | 'logs' | 'diff' | 'proposal';
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ActionLog = { id: string; message: string; status: 'ok' | 'warn' };
type ModalState =
  | { type: 'create-file'; title: string }
  | { type: 'create-folder'; title: string }
  | { type: 'rename'; title: string; entry: WorkspaceEntry }
  | { type: 'move'; title: string; entry: WorkspaceEntry }
  | { type: 'delete'; title: string; entry: WorkspaceEntry }
  | { type: 'switch-workspace'; title: string }
  | null;

interface SettingsState {
  selectedModelId: string;
  vaultPath: string;
  workspacePath: string;
  theme: 'dark' | 'light';
}

interface EditorTab {
  path: string;
  name: string;
  content: string;
  savedContent: string;
  language: string;
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<WorkspaceEntry | null>(null);
  const [gitFiles, setGitFiles] = useState<GitFileStatus[]>([]);
  const [selectedGitFile, setSelectedGitFile] = useState<string>('');
  const [diff, setDiff] = useState('');
  const [tabs, setTabs] = useState<EditorTab[]>([welcomeTab]);
  const [activeTabPath, setActiveTabPath] = useState(welcomeTab.path);
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [proposalAccepted, setProposalAccepted] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalValue, setModalValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  const activeTab = tabs.find((tab) => tab.path === activeTabPath) ?? tabs[0];
  const selectedModel = useMemo(
    () => models.find((model) => model.id === settings.selectedModelId) ?? models[0],
    [settings.selectedModelId],
  );
  const dirtyTabs = tabs.filter((tab) => tab.content !== tab.savedContent);

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    void initializeWorkspace();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (workspacePath) {
        void refreshWorkspace(workspacePath, { quiet: true });
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [workspacePath]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveActiveFile();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  async function initializeWorkspace() {
    const path = settings.workspacePath || (await getDefaultWorkspacePath());
    setWorkspacePath(path);
    setSettings((current) => ({ ...current, workspacePath: path }));
    await refreshWorkspace(path);
  }

  async function refreshWorkspace(path = workspacePath, options?: { quiet?: boolean }) {
    const [workspaceEntries, status] = await Promise.all([
      listWorkspaceEntries(path),
      getGitStatus(path),
    ]);
    setFiles(workspaceEntries);
    setGitFiles(status);
    if (!options?.quiet) {
      addLog(`Workspace atualizado: ${path}`, 'ok');
    }
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
    if (dirtyTabs.length > 0) {
      openModal({ type: 'switch-workspace', title: 'Trocar projeto?' });
      return;
    }

    await selectAndApplyWorkspace();
  }

  async function selectAndApplyWorkspace() {
    const selected = await selectWorkspaceFolder();
    if (!selected) {
      return;
    }

    setWorkspacePath(selected);
    setSettings((current) => ({ ...current, workspacePath: selected }));
    setTabs([welcomeTab]);
    setActiveTabPath(welcomeTab.path);
    await refreshWorkspace(selected);
  }

  async function openWorkspaceFile(file: WorkspaceEntry) {
    setSelectedEntry(file);
    if (file.kind === 'directory') {
      toggleFolder(file.path);
      return;
    }

    const existing = tabs.find((tab) => tab.path === file.path);
    if (existing) {
      setActiveTabPath(existing.path);
      return;
    }

    try {
      const result = await readTextFile(workspacePath, file.path);
      const tab: EditorTab = {
        path: result.path,
        name: file.name,
        content: result.content,
        savedContent: result.content,
        language: languageFromPath(result.path),
      };
      setTabs((current) => [...current, tab]);
      setActiveTabPath(tab.path);
      addLog(`Arquivo aberto: ${file.name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function saveActiveFile() {
    if (activeTab.path === welcomeTab.path) {
      addLog('Abra um arquivo do workspace antes de salvar', 'warn');
      return;
    }

    try {
      await writeTextFile(workspacePath, activeTab.path, activeTab.content);
      setTabs((current) =>
        current.map((tab) =>
          tab.path === activeTab.path ? { ...tab, savedContent: tab.content } : tab,
        ),
      );
      await refreshWorkspace(workspacePath, { quiet: true });
      addLog(`Arquivo salvo: ${activeTab.name}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function updateActiveTab(content: string) {
    setTabs((current) =>
      current.map((tab) => (tab.path === activeTab.path ? { ...tab, content } : tab)),
    );
  }

  function closeTab(tab: EditorTab) {
    if (tab.path === welcomeTab.path) {
      return;
    }

    if (tab.content !== tab.savedContent) {
      openModal({ type: 'delete', title: `Fechar "${tab.name}" sem salvar?`, entry: tabToEntry(tab) });
      return;
    }

    setTabs((current) => current.filter((item) => item.path !== tab.path));
    if (activeTabPath === tab.path) {
      setActiveTabPath(welcomeTab.path);
    }
  }

  function openModal(nextModal: ModalState) {
    setModal(nextModal);
    if (nextModal?.type === 'rename') {
      setModalValue(nextModal.entry.name);
    } else if (nextModal?.type === 'move') {
      setModalValue(workspacePath);
    } else {
      setModalValue('');
    }
  }

  async function submitModal() {
    if (!modal) {
      return;
    }

    try {
      if (modal.type === 'create-file') {
        await createFile(workspacePath, parentForNewEntry(), modalValue);
        addLog(`Arquivo criado: ${modalValue}`, 'ok');
      }
      if (modal.type === 'create-folder') {
        await createFolder(workspacePath, parentForNewEntry(), modalValue);
        addLog(`Pasta criada: ${modalValue}`, 'ok');
      }
      if (modal.type === 'rename') {
        await renameEntry(workspacePath, modal.entry.path, modalValue);
        addLog(`Renomeado: ${modal.entry.name} -> ${modalValue}`, 'ok');
      }
      if (modal.type === 'move') {
        await moveEntry(workspacePath, modal.entry.path, modalValue);
        addLog(`Movido: ${modal.entry.name}`, 'ok');
      }
      if (modal.type === 'switch-workspace') {
        setModal(null);
        await selectAndApplyWorkspace();
        return;
      }
      if (modal.type === 'delete') {
        if (modal.entry.path.startsWith('tab:')) {
          const tabPath = modal.entry.path.replace('tab:', '');
          setTabs((current) => current.filter((item) => item.path !== tabPath));
          setActiveTabPath(welcomeTab.path);
        } else {
          await deleteEntry(workspacePath, modal.entry.path);
          setTabs((current) => current.filter((tab) => tab.path !== modal.entry.path));
          if (activeTab.path === modal.entry.path) {
            setActiveTabPath(welcomeTab.path);
          }
          addLog(`Removido: ${modal.entry.name}`, 'ok');
        }
      }

      setModal(null);
      await refreshWorkspace();
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function parentForNewEntry() {
    return selectedEntry?.kind === 'directory' ? selectedEntry.path : workspacePath;
  }

  async function runSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = await searchWorkspace(workspacePath, searchQuery);
    setSearchResults(results);
    setActiveView('search');
    addLog(`${results.length} resultados encontrados`, 'ok');
  }

  async function loadSearchResult(result: SearchResult) {
    const name = shortPath(result.path);
    await openWorkspaceFile({ name, path: result.path, kind: 'file', children: [] });
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

  function toggleFolder(path: string) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function runCommand(command: string) {
    setPaletteOpen(false);
    setPaletteQuery('');
    if (command === 'open-folder') void chooseWorkspace();
    if (command === 'save-file') void saveActiveFile();
    if (command === 'search') setActiveView('search');
    if (command === 'settings') setActiveView('settings');
    if (command === 'toggle-theme') {
      setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }));
    }
  }

  const filteredCommands = commands.filter((command) =>
    command.label.toLowerCase().includes(paletteQuery.toLowerCase()),
  );

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
              <button className="icon-button" onClick={() => openModal({ type: 'create-file', title: 'Criar arquivo' })} title="Criar arquivo" type="button">
                <FilePlus2 size={16} />
              </button>
              <button className="icon-button" onClick={() => openModal({ type: 'create-folder', title: 'Criar pasta' })} title="Criar pasta" type="button">
                <FolderPlus size={16} />
              </button>
              <button className="icon-button" disabled={!selectedEntry} onClick={() => selectedEntry && openModal({ type: 'rename', title: 'Renomear', entry: selectedEntry })} title="Renomear" type="button">
                <Pencil size={16} />
              </button>
              <button className="icon-button" disabled={!selectedEntry} onClick={() => selectedEntry && openModal({ type: 'move', title: 'Mover', entry: selectedEntry })} title="Mover" type="button">
                <MoveRight size={16} />
              </button>
              <button className="icon-button danger" disabled={!selectedEntry} onClick={() => selectedEntry && openModal({ type: 'delete', title: 'Remover item', entry: selectedEntry })} title="Remover selecionado" type="button">
                <Trash2 size={16} />
              </button>
              <button className="icon-button" onClick={() => void refreshWorkspace()} title="Atualizar" type="button">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="workspace-path">{workspacePath}</div>
            {files.map((file) => (
              <TreeEntry
                entry={file}
                expandedFolders={expandedFolders}
                key={file.path}
                level={0}
                onOpen={(entry) => void openWorkspaceFile(entry)}
                selectedPath={selectedEntry?.path}
              />
            ))}
          </div>
        )}
        {activeView === 'search' && (
          <div className="settings-panel">
            <label>
              Buscar no projeto
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void runSearch();
                }}
                placeholder="Texto a buscar"
              />
            </label>
            <button className="primary-button with-icon" onClick={() => void runSearch()} type="button">
              <Search size={15} />
              Buscar
            </button>
            <div className="panel-list compact">
              {searchResults.map((result) => (
                <button
                  className="search-result"
                  key={`${result.path}-${result.line}-${result.preview}`}
                  onClick={() => void loadSearchResult(result)}
                  type="button"
                >
                  <strong>{shortPath(result.path)}:{result.line}</strong>
                  <span>{result.preview}</span>
                </button>
              ))}
            </div>
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
          <button className="model-badge" onClick={() => setPaletteOpen(true)} type="button">
            {selectedModel.name}
          </button>
        </div>
        <div className="editor-tabs">
          {tabs.map((tab) => (
            <button
              className={activeTab.path === tab.path ? 'tab active' : 'tab'}
              key={tab.path}
              onClick={() => setActiveTabPath(tab.path)}
              type="button"
            >
              {tab.content !== tab.savedContent && <span className="dirty-dot" />}
              {tab.name}
              {tab.path !== welcomeTab.path && (
                <span className="tab-close" onClick={(event) => { event.stopPropagation(); closeTab(tab); }}>
                  x
                </span>
              )}
            </button>
          ))}
          <button className="tab-action" onClick={() => void saveActiveFile()} title="Salvar arquivo" type="button">
            <Save size={15} />
            Salvar
          </button>
        </div>
        <div className="editor-frame">
          <Editor
            language={activeTab.language}
            height="100%"
            theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
            value={activeTab.content}
            onChange={(value) => updateActiveTab(value ?? '')}
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
          {bottomView === 'terminal' && <pre className="terminal-view">npm run tauri -- dev</pre>}
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

      {paletteOpen && (
        <div className="overlay" onMouseDown={() => setPaletteOpen(false)}>
          <div className="palette" onMouseDown={(event) => event.stopPropagation()}>
            <input
              autoFocus
              value={paletteQuery}
              onChange={(event) => setPaletteQuery(event.target.value)}
              placeholder="Digite um comando..."
            />
            {filteredCommands.map((command) => (
              <button key={command.id} onClick={() => runCommand(command.id)} type="button">
                {command.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div className="overlay" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>{modal.title}</h2>
            {modal.type === 'delete' || modal.type === 'switch-workspace' ? (
              <p>Esta acao e sensivel. Confirme para continuar.</p>
            ) : (
              <input
                autoFocus
                value={modalValue}
                onChange={(event) => setModalValue(event.target.value)}
                placeholder={modal.type === 'move' ? 'Pasta de destino' : 'Nome'}
              />
            )}
            <div className="modal-actions">
              <button className="text-button" onClick={() => setModal(null)} type="button">
                Cancelar
              </button>
              <button
                className={modal.type === 'delete' || modal.type === 'switch-workspace' ? 'primary-button danger' : 'primary-button'}
                onClick={() => void submitModal()}
                type="button"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TreeEntry({
  entry,
  expandedFolders,
  level,
  onOpen,
  selectedPath,
}: {
  entry: WorkspaceEntry;
  expandedFolders: Set<string>;
  level: number;
  onOpen: (entry: WorkspaceEntry) => void;
  selectedPath?: string;
}) {
  const expanded = expandedFolders.has(entry.path);
  return (
    <>
      <button
        className={selectedPath === entry.path ? 'list-row button-row selected' : 'list-row button-row'}
        onClick={() => onOpen(entry)}
        style={{ paddingLeft: `${8 + level * 14}px` }}
        type="button"
      >
        {entry.kind === 'directory' ? <Folder size={15} /> : <File size={15} />}
        {entry.kind === 'directory' && <span className="tree-caret">{expanded ? '-' : '+'}</span>}
        {entry.name}
      </button>
      {entry.kind === 'directory' &&
        expanded &&
        entry.children.map((child) => (
          <TreeEntry
            entry={child}
            expandedFolders={expandedFolders}
            key={child.path}
            level={level + 1}
            onOpen={onOpen}
            selectedPath={selectedPath}
          />
        ))}
    </>
  );
}

const activityItems: Array<{ id: ActivityView; label: string; Icon: LucideIcon }> = [
  { id: 'files', label: 'Arquivos', Icon: Folder },
  { id: 'search', label: 'Busca', Icon: Search },
  { id: 'git', label: 'Git', Icon: GitBranch },
  { id: 'settings', label: 'Configuracoes', Icon: Settings },
  { id: 'plugins', label: 'Plugins', Icon: Boxes },
  { id: 'context', label: 'Contexto', Icon: Code2 },
  { id: 'agents', label: 'Agentes', Icon: Bot },
];

const sidebarTitle: Record<ActivityView, string> = {
  files: 'Arquivos',
  search: 'Busca',
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

const commands = [
  { id: 'open-folder', label: 'Abrir pasta do projeto' },
  { id: 'save-file', label: 'Salvar arquivo atual' },
  { id: 'search', label: 'Buscar no projeto' },
  { id: 'settings', label: 'Abrir configuracoes' },
  { id: 'toggle-theme', label: 'Alternar tema' },
];

const sampleCode = `import type { TextModelProvider } from './domain';

export const provider: TextModelProvider = {
  id: 'mock',
  name: 'Mock Provider',
  async sendMessage(input) {
    return \`Resposta simulada para: \${input}\`;
  },
};
`;

const welcomeTab: EditorTab = {
  path: 'welcome.ts',
  name: 'welcome.ts',
  content: sampleCode,
  savedContent: sampleCode,
  language: 'typescript',
};

function tabToEntry(tab: EditorTab): WorkspaceEntry {
  return { name: tab.name, path: `tab:${tab.path}`, kind: 'file', children: [] };
}

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
