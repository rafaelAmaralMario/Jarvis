import { useEffect, useMemo, useRef, useState } from 'react';
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
import { agentDefinitions } from '../agents';
import jarvisIcon from '../assets/jarvis-icon.svg';
import type { ProviderKind } from '../domain';
import { createTextProvider } from '../infrastructure/model-providers';
import {
  createFile,
  createFolder,
  commitGit,
  checkoutGitBranch,
  createGitBranch,
  deleteEntry,
  getDefaultWorkspacePath,
  getGithubPrUrl,
  getGitDiff,
  getGitStatus,
  listGitBranches,
  listLocalPluginManifests,
  listMarkdownNotes,
  listWorkspaceEntries,
  loadSecureSettings,
  moveEntry,
  readTextFile,
  renameEntry,
  saveSecureSettings,
  searchWorkspace,
  selectWorkspaceFolder,
  stageGitFile,
  unstageGitFile,
  validatePath,
  writeMarkdownNote,
  writeTextFile,
  type GitBranch as GitBranchInfo,
  type GitFileStatus,
  type LocalPluginManifest,
  type MarkdownNote,
  type SearchResult,
  type WorkspaceEntry,
} from '../infrastructure/native';
import type { PluginManifest } from '../plugins';
import { pluginManifests } from '../plugins/manifests';

type ActivityView = 'files' | 'git' | 'search' | 'settings' | 'plugins' | 'context' | 'agents';
type BottomView = 'terminal' | 'logs' | 'diff' | 'proposal' | 'audit';
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ActionLog = { id: string; message: string; status: 'ok' | 'warn' };
type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  permission: string;
  target: string;
  result: string;
};
type MemoryEntry = { id: string; content: string; createdAt: string };
type ContextResult = { id: string; title: string; source: string; score: number; preview: string };
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
  providerKind: ProviderKind;
  ollamaBaseUrl: string;
  openaiCompatibleBaseUrl: string;
  vaultPath: string;
  workspacePath: string;
  theme: 'dark' | 'light';
  sidebarWidth: number;
  aiPanelWidth: number;
  permissions: Record<PermissionId, boolean>;
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
  providerKind: 'mock',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  openaiCompatibleBaseUrl: 'https://api.openai.com/v1',
  vaultPath: '',
  workspacePath: '',
  theme: 'dark',
  sidebarWidth: 300,
  aiPanelWidth: 380,
  permissions: {
    'read-workspace': true,
    'write-workspace': false,
    git: true,
    network: false,
    secrets: false,
  },
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
  const [gitBranches, setGitBranches] = useState<GitBranchInfo[]>([]);
  const [selectedGitFile, setSelectedGitFile] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [diff, setDiff] = useState('');
  const [tabs, setTabs] = useState<EditorTab[]>([welcomeTab]);
  const [activeTabPath, setActiveTabPath] = useState(welcomeTab.path);
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [memoryInput, setMemoryInput] = useState('');
  const [contextQuery, setContextQuery] = useState('');
  const [contextResults, setContextResults] = useState<ContextResult[]>([]);
  const [localPlugins, setLocalPlugins] = useState<LocalPluginManifest[]>([]);
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>(loadEnabledPlugins);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [secureApiKey, setSecureApiKey] = useState('');
  const [generationActive, setGenerationActive] = useState(false);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [proposalAccepted, setProposalAccepted] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalValue, setModalValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const generationController = useRef<AbortController | null>(null);

  const activeTab = tabs.find((tab) => tab.path === activeTabPath) ?? tabs[0];
  const selectedModel = useMemo(
    () => models.find((model) => model.id === settings.selectedModelId) ?? models[0],
    [settings.selectedModelId],
  );
  const dirtyTabs = tabs.filter((tab) => tab.content !== tab.savedContent);
  const visiblePlugins: PluginManifest[] = [
    ...pluginManifests.map((plugin) => ({ ...plugin, valid: true, source: 'builtin' })),
    ...localPlugins,
  ];

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('jarvis.plugins.enabled', JSON.stringify(enabledPlugins));
  }, [enabledPlugins]);

  useEffect(() => {
    void initializeWorkspace();
    void initializeSecureSettings();
  }, []);

  useEffect(() => {
    if (!workspacePath) {
      return;
    }

    setMessages(loadWorkspaceMessages(workspacePath));
    setAuditEvents(loadWorkspaceAudit(workspacePath));
    setMemoryEntries(loadWorkspaceMemory(workspacePath));
    void refreshLocalPlugins(workspacePath);
  }, [workspacePath]);

  useEffect(() => {
    if (workspacePath) {
      localStorage.setItem(historyKey(workspacePath), JSON.stringify(messages));
    }
  }, [messages, workspacePath]);

  useEffect(() => {
    if (workspacePath) {
      localStorage.setItem(auditKey(workspacePath), JSON.stringify(auditEvents));
    }
  }, [auditEvents, workspacePath]);

  useEffect(() => {
    if (workspacePath) {
      localStorage.setItem(memoryKey(workspacePath), JSON.stringify(memoryEntries));
    }
  }, [memoryEntries, workspacePath]);

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

  async function initializeSecureSettings() {
    try {
      const secureSettings = await loadSecureSettings();
      setSecureApiKey(secureSettings.openaiCompatibleApiKey);
    } catch (error) {
      addLog(`Configuracao sensivel nao carregada: ${String(error)}`, 'warn');
    }
  }

  async function refreshWorkspace(path = workspacePath, options?: { quiet?: boolean }) {
    const [workspaceEntries, status] = await Promise.all([
      listWorkspaceEntries(path),
      getGitStatus(path),
    ]);
    setFiles(workspaceEntries);
    setGitFiles(status);
    await refreshBranches(path);
    if (!options?.quiet) {
      addLog(`Workspace atualizado: ${path}`, 'ok');
    }
  }

  async function refreshBranches(path = workspacePath) {
    try {
      setGitBranches(await listGitBranches(path));
    } catch {
      setGitBranches([]);
    }
  }

  async function refreshLocalPlugins(path = workspacePath) {
    try {
      setLocalPlugins(await listLocalPluginManifests(path));
    } catch {
      setLocalPlugins([]);
    }
  }

  function addLog(message: string, status: ActionLog['status'] = 'ok') {
    setLogs((current) => [
      { id: crypto.randomUUID(), message, status },
      ...current.slice(0, 24),
    ]);
  }

  function addAudit(actor: string, permission: string, target: string, result: string) {
    setAuditEvents((current) => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleString(),
        actor,
        permission,
        target,
        result,
      },
      ...current.slice(0, 79),
    ]);
  }

  async function sendMessage() {
    const input = chatInput.trim();
    if (!input || generationActive) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', content: input }]);
    setChatInput('');
    setMessages((current) => [...current, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    generationController.current = controller;
    setGenerationActive(true);

    const provider = createTextProvider({
      kind: settings.providerKind,
      modelId: settings.selectedModelId,
      baseUrl:
        settings.providerKind === 'ollama'
          ? settings.ollamaBaseUrl
          : settings.openaiCompatibleBaseUrl,
      apiKey: secureApiKey,
    });

    try {
      await provider.sendMessage({
        input,
        modelId: settings.selectedModelId,
        signal: controller.signal,
        onToken(token) {
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1
                ? { ...message, content: `${message.content}${token}` }
                : message,
            ),
          );
        },
      });
      addLog(`Chat respondido por ${provider.name}`, 'ok');
    } catch (error) {
      const canceled = error instanceof DOMException && error.name === 'AbortError';
      addLog(canceled ? 'Geracao cancelada pelo usuario' : String(error), canceled ? 'ok' : 'warn');
    } finally {
      generationController.current = null;
      setGenerationActive(false);
    }
  }

  function cancelGeneration() {
    generationController.current?.abort();
  }

  async function openDiff(filePath: string) {
    setSelectedGitFile(filePath);
    setBottomView('diff');
    const result = await getGitDiff(workspacePath, filePath);
    setDiff(result || 'Sem diff textual disponivel para este arquivo.');
    addLog(`Diff carregado: ${filePath}`, 'ok');
  }

  async function stageFile(filePath: string) {
    try {
      await stageGitFile(workspacePath, filePath);
      await refreshWorkspace(workspacePath, { quiet: true });
      addAudit('Git', 'git', filePath, 'Stage');
      addLog(`Stage aplicado: ${filePath}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function unstageFile(filePath: string) {
    try {
      await unstageGitFile(workspacePath, filePath);
      await refreshWorkspace(workspacePath, { quiet: true });
      addAudit('Git', 'git', filePath, 'Unstage');
      addLog(`Stage removido: ${filePath}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createCommit() {
    try {
      await commitGit(workspacePath, commitMessage);
      setCommitMessage('');
      await refreshWorkspace(workspacePath, { quiet: true });
      addAudit('Git', 'git', workspacePath, 'Commit criado');
      addLog('Commit criado com sucesso', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function suggestCommitMessage() {
    const summary = gitFiles
      .slice(0, 3)
      .map((file) => shortPath(file.path))
      .join(', ');
    setCommitMessage(summary ? `chore: update ${summary}` : 'chore: update project');
  }

  async function createBranch() {
    try {
      await createGitBranch(workspacePath, branchName);
      setBranchName('');
      await refreshWorkspace(workspacePath, { quiet: true });
      addAudit('Git', 'git', workspacePath, 'Branch criada');
      addLog('Branch criada e ativada', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function checkoutBranch(branch: string) {
    try {
      await checkoutGitBranch(workspacePath, branch);
      await refreshWorkspace(workspacePath, { quiet: true });
      addAudit('Git', 'git', branch, 'Checkout de branch');
      addLog(`Branch ativa: ${branch}`, 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function createPullRequestUrl() {
    try {
      const url = await getGithubPrUrl(workspacePath);
      setPrUrl(url);
      addAudit('GitHub', 'network', workspacePath, 'URL de PR gerada');
      addLog('URL de Pull Request gerada', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function chooseWorkspace() {
    if (dirtyTabs.length > 0) {
      openModal({ type: 'switch-workspace', title: 'Trocar projeto?' });
      return;
    }

    await selectAndApplyWorkspace();
  }

  async function selectAndApplyWorkspace() {
    try {
      const selected = await selectWorkspaceFolder();
      if (!selected) {
        addLog('Selecao de projeto cancelada', 'ok');
        return;
      }

      const exists = await validatePath(selected);
      if (!exists) {
        addLog(`Projeto nao encontrado: ${selected}`, 'warn');
        return;
      }

      setWorkspacePath(selected);
      setSettings((current) => ({ ...current, workspacePath: selected }));
      setSelectedEntry(null);
      setExpandedFolders(new Set());
      setTabs([welcomeTab]);
      setActiveTabPath(welcomeTab.path);
      await refreshWorkspace(selected);
      addAudit('Workspace', 'read-workspace', selected, 'Projeto aberto');
    } catch (error) {
      addLog(`Nao foi possivel abrir projeto: ${formatError(error)}`, 'warn');
      addAudit('Workspace', 'read-workspace', workspacePath || 'sem workspace', 'Falha ao abrir projeto');
    }
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
    addAudit('Context Engine', 'read-workspace', settings.vaultPath, 'Notas indexadas');
  }

  function addMemory() {
    const content = memoryInput.trim();
    if (!content) {
      return;
    }

    setMemoryEntries((current) => [
      { id: crypto.randomUUID(), content, createdAt: new Date().toLocaleString() },
      ...current,
    ]);
    setMemoryInput('');
    addAudit('Memory Engine', 'read-workspace', workspacePath, 'Memoria adicionada');
  }

  function runContextSearch() {
    const results = searchContext(contextQuery, notes, memoryEntries);
    setContextResults(results);
    addLog(`${results.length} itens de contexto encontrados`, 'ok');
  }

  async function writeMemoryToObsidian() {
    if (!settings.vaultPath.trim() || !memoryInput.trim()) {
      addLog('Informe o vault e o conteudo da nota', 'warn');
      return;
    }

    try {
      const path = await writeMarkdownNote(
        settings.vaultPath,
        `Jarvis ${new Date().toISOString().slice(0, 10)}`,
        memoryInput,
      );
      addLog(`Nota criada no Obsidian: ${path}`, 'ok');
      addAudit('Obsidian Writer', 'write-workspace', path, 'Nota Markdown criada');
      await loadObsidianNotes();
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function persistSecureApiKey(value = secureApiKey) {
    try {
      await saveSecureSettings({ openaiCompatibleApiKey: value });
      addLog('Chave sensivel salva no backend local', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function acceptProposal() {
    setProposalAccepted(true);
    addLog('Proposta mockada aceita para validacao do fluxo', 'ok');
    addAudit('Agente Desenvolvedor', 'write-workspace', activeTab.path, 'Proposta aceita pela UI');
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

  function updateProviderKind(providerKind: ProviderKind) {
    const firstModel = models.find((model) => model.providerId === providerKind) ?? models[0];
    setSettings((current) => ({
      ...current,
      providerKind,
      selectedModelId: firstModel.id,
    }));
  }

  function updatePermission(permission: PermissionId, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      permissions: { ...current.permissions, [permission]: enabled },
    }));
  }

  function hasAgentPermissions(permissions: string[]) {
    return permissions.every((permission) => settings.permissions[permission as PermissionId]);
  }

  function runAgent(agentId: string) {
    const agent = agentDefinitions.find((item) => item.id === agentId);
    if (!agent) {
      return;
    }

    if (!hasAgentPermissions(agent.permissions)) {
      addLog(`Permissoes insuficientes para o agente ${agent.name}`, 'warn');
      addAudit(agent.name, agent.permissions.join(', '), activeTab.path, 'Bloqueado por permissao');
      return;
    }

    if (agent.id === 'developer') {
      const proposal = createAgentDiff(activeTab);
      setDiff(proposal);
      setProposalAccepted(false);
      setBottomView('proposal');
      addLog('Agente Desenvolvedor gerou uma proposta revisavel', 'ok');
      addAudit(agent.name, agent.permissions.join(', '), activeTab.path, 'Diff proposto');
      return;
    }

    if (agent.id === 'reviewer') {
      const review = createReview(activeTab);
      setDiff(review);
      setBottomView('diff');
      addLog('Agente Revisor gerou uma revisao local', 'ok');
      addAudit(agent.name, agent.permissions.join(', '), activeTab.path, 'Revisao gerada');
      return;
    }

    const docs = createDocumentationProposal(activeTab);
    setDiff(docs);
    setBottomView('diff');
    addLog('Agente Documentador gerou uma proposta de documentacao', 'ok');
    addAudit(agent.name, agent.permissions.join(', '), activeTab.path, 'Documentacao proposta');
  }

  function togglePlugin(plugin: PluginManifest) {
    const verification = verifyPlugin(plugin, settings.permissions);
    if (!verification.allowed) {
      addLog(verification.reason, 'warn');
      addAudit('Plugin Manager', plugin.permissions.join(', '), plugin.id, 'Ativacao bloqueada');
      return;
    }

    setEnabledPlugins((current) =>
      current.includes(plugin.id)
        ? current.filter((id) => id !== plugin.id)
        : [...current, plugin.id],
    );
    addAudit('Plugin Manager', plugin.permissions.join(', '), plugin.id, 'Estado alterado');
  }

  const filteredCommands = commands.filter((command) =>
    command.label.toLowerCase().includes(paletteQuery.toLowerCase()),
  );

  return (
    <main
      className={`app-shell theme-${settings.theme}`}
      style={{
        gridTemplateColumns: `52px minmax(240px, ${settings.sidebarWidth}px) minmax(480px, 1fr) minmax(300px, ${settings.aiPanelWidth}px)`,
      }}
    >
      <aside className="activity-bar" aria-label="Navegacao principal">
        <span className="activity-logo">
          <img alt="JARVIS" src={jarvisIcon} />
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
            <div className="git-tools">
              <label>
                Mensagem de commit
                <input
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder="feat: ..."
                />
              </label>
              <div className="split-actions">
                <button className="text-button" onClick={suggestCommitMessage} type="button">
                  Sugerir
                </button>
                <button className="primary-button" onClick={() => void createCommit()} type="button">
                  Commit
                </button>
              </div>
              <label>
                Nova branch
                <input
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  placeholder="feature/nome"
                />
              </label>
              <button className="text-button" onClick={() => void createBranch()} type="button">
                Criar branch
              </button>
              <button className="text-button" onClick={() => void createPullRequestUrl()} type="button">
                Gerar URL de PR
              </button>
              {prUrl && (
                <a className="external-link" href={prUrl} rel="noreferrer" target="_blank">
                  Abrir Pull Request
                </a>
              )}
            </div>
            <div className="branch-list">
              {gitBranches.map((branch) => (
                <button
                  className={branch.current ? 'branch-button active' : 'branch-button'}
                  key={branch.name}
                  onClick={() => void checkoutBranch(branch.name)}
                  type="button"
                >
                  {branch.name}
                </button>
              ))}
            </div>
            {gitFiles.length === 0 && <div className="empty-state">Nenhuma mudanca Git.</div>}
            {gitFiles.map((file) => (
              <div className="git-file-row" key={file.path}>
                <button
                  className="list-row button-row"
                  onClick={() => void openDiff(file.path)}
                  type="button"
                >
                  <span className="status-pill">{file.status || '??'}</span>
                  {file.path}
                </button>
                <div className="split-actions">
                  <button className="text-button" onClick={() => void stageFile(file.path)} type="button">
                    Stage
                  </button>
                  <button className="text-button" onClick={() => void unstageFile(file.path)} type="button">
                    Unstage
                  </button>
                </div>
              </div>
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
              Provider de IA
              <select
                value={settings.providerKind}
                onChange={(event) => updateProviderKind(event.target.value as ProviderKind)}
              >
                <option value="mock">Mock local</option>
                <option value="ollama">Ollama local</option>
                <option value="openai-compatible">OpenAI-compatible</option>
              </select>
            </label>
            <label>
              Modelo ativo
              <select
                value={settings.selectedModelId}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, selectedModelId: event.target.value }))
                }
              >
                {models
                  .filter((model) => model.providerId === settings.providerKind)
                  .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>
            {settings.providerKind === 'ollama' && (
              <label>
                Endpoint Ollama
                <input
                  value={settings.ollamaBaseUrl}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, ollamaBaseUrl: event.target.value }))
                  }
                  placeholder="http://127.0.0.1:11434"
                />
              </label>
            )}
            {settings.providerKind === 'openai-compatible' && (
              <>
                <label>
                  Endpoint OpenAI-compatible
                  <input
                    value={settings.openaiCompatibleBaseUrl}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        openaiCompatibleBaseUrl: event.target.value,
                      }))
                    }
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
                <label>
                  API key
                  <input
                    value={secureApiKey}
                    onChange={(event) => setSecureApiKey(event.target.value)}
                    placeholder="sk-..."
                    type="password"
                  />
                </label>
                <button className="primary-button" onClick={() => void persistSecureApiKey()} type="button">
                  Salvar chave
                </button>
              </>
            )}
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
              Largura do explorador
              <input
                max="420"
                min="240"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    sidebarWidth: Number(event.target.value),
                  }))
                }
                type="range"
                value={settings.sidebarWidth}
              />
            </label>
            <label>
              Largura do painel de IA
              <input
                max="520"
                min="300"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    aiPanelWidth: Number(event.target.value),
                  }))
                }
                type="range"
                value={settings.aiPanelWidth}
              />
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
            <section className="permission-center">
              <strong>Permissoes por workspace</strong>
              {permissionItems.map((permission) => (
                <label className="toggle-row" key={permission.id}>
                  <span>
                    {permission.label}
                    <small>{permission.description}</small>
                  </span>
                  <input
                    checked={settings.permissions[permission.id]}
                    onChange={(event) => updatePermission(permission.id, event.target.checked)}
                    type="checkbox"
                  />
                </label>
              ))}
            </section>
          </div>
        )}
        {activeView === 'plugins' && (
          <div className="panel-list">
            <button className="text-button" onClick={() => void refreshLocalPlugins()} type="button">
              Recarregar manifestos locais
            </button>
            {visiblePlugins.map((plugin) => (
              <article className="plugin-card" key={plugin.id}>
                <div>
                  <strong>{plugin.name}</strong>
                  <span>{enabledPlugins.includes(plugin.id) ? 'Ativo' : plugin.version}</span>
                </div>
                <p>{plugin.capabilities.join(', ')}</p>
                <small>Permissoes: {plugin.permissions.join(', ') || 'nenhuma'}</small>
                {plugin.source && <small>Origem: {plugin.source}</small>}
                {!plugin.valid && <small>Erros: {plugin.errors?.join(', ')}</small>}
                <button className="text-button" onClick={() => togglePlugin(plugin)} type="button">
                  {enabledPlugins.includes(plugin.id) ? 'Desativar' : 'Ativar'}
                </button>
              </article>
            ))}
          </div>
        )}
        {activeView === 'context' && (
          <div className="panel-list">
            <label className="context-input">
              Buscar contexto
              <input
                value={contextQuery}
                onChange={(event) => setContextQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') runContextSearch();
                }}
                placeholder="termo, decisao, arquivo..."
              />
            </label>
            <button className="primary-button" onClick={runContextSearch} type="button">
              Buscar memoria
            </button>
            <label className="context-input">
              Nova memoria
              <textarea
                value={memoryInput}
                onChange={(event) => setMemoryInput(event.target.value)}
                placeholder="Registre uma decisao, regra ou contexto importante..."
              />
            </label>
            <div className="split-actions">
              <button className="text-button" onClick={addMemory} type="button">
                Salvar local
              </button>
              <button className="text-button" onClick={() => void writeMemoryToObsidian()} type="button">
                Enviar ao Obsidian
              </button>
            </div>
            {contextResults.map((result) => (
              <article className="context-card" key={result.id}>
                <strong>{result.title}</strong>
                <span>{result.source} | score {result.score}</span>
                <p>{result.preview}</p>
              </article>
            ))}
            {memoryEntries.map((entry) => (
              <article className="context-card" key={entry.id}>
                <strong>Memoria local</strong>
                <span>{entry.createdAt}</span>
                <p>{entry.content}</p>
              </article>
            ))}
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
            {agentDefinitions.map((agent) => (
              <article className="plugin-card" key={agent.id}>
                <strong>Agente {agent.name}</strong>
                <p>{agent.goal}</p>
                <small>Permissoes: {agent.permissions.join(', ')}</small>
                <button className="text-button" onClick={() => runAgent(agent.id)} type="button">
                  Executar
                </button>
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
            {(['logs', 'diff', 'proposal', 'audit', 'terminal'] as BottomView[]).map((view) => (
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
              <strong>Proposta de alteracao</strong>
              <pre className="proposal-diff">{diff || 'Nenhuma proposta gerada.'}</pre>
              <button className="primary-button" onClick={acceptProposal} type="button">
                <CheckCircle2 size={15} />
                Aceitar proposta
              </button>
              {proposalAccepted && <span className="accepted">Proposta aceita.</span>}
            </div>
          )}
          {bottomView === 'audit' && (
            <div className="bottom-content">
              {auditEvents.map((event) => (
                <div className="audit-row" key={event.id}>
                  <strong>{event.actor}</strong>
                  <span>{event.timestamp}</span>
                  <small>{event.permission} | {event.target} | {event.result}</small>
                </div>
              ))}
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
            {generationActive ? 'Gerando...' : 'Enviar'}
          </button>
          {generationActive && (
            <button className="text-button" onClick={cancelGeneration} type="button">
              Cancelar
            </button>
          )}
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
  audit: 'Auditoria',
};

type PermissionId = 'read-workspace' | 'write-workspace' | 'git' | 'network' | 'secrets';

const permissionItems: Array<{ id: PermissionId; label: string; description: string }> = [
  {
    id: 'read-workspace',
    label: 'Ler workspace',
    description: 'Permite agentes analisarem arquivos do projeto.',
  },
  {
    id: 'write-workspace',
    label: 'Propor escrita',
    description: 'Permite agentes criarem propostas de alteracao.',
  },
  {
    id: 'git',
    label: 'Usar Git',
    description: 'Permite leitura de status e diffs Git.',
  },
  {
    id: 'network',
    label: 'Acessar rede',
    description: 'Reservado para providers e integracoes externas.',
  },
  {
    id: 'secrets',
    label: 'Usar secrets',
    description: 'Permite acessar chaves salvas quando necessario.',
  },
];

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

function historyKey(workspacePath: string) {
  return `jarvis.chat.${workspacePath}`;
}

function loadWorkspaceMessages(workspacePath: string): ChatMessage[] {
  const stored = localStorage.getItem(historyKey(workspacePath));
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function auditKey(workspacePath: string) {
  return `jarvis.audit.${workspacePath}`;
}

function loadWorkspaceAudit(workspacePath: string): AuditEvent[] {
  const stored = localStorage.getItem(auditKey(workspacePath));
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function memoryKey(workspacePath: string) {
  return `jarvis.memory.${workspacePath}`;
}

function loadWorkspaceMemory(workspacePath: string): MemoryEntry[] {
  const stored = localStorage.getItem(memoryKey(workspacePath));
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function searchContext(
  query: string,
  notes: MarkdownNote[],
  memories: MemoryEntry[],
): ContextResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  const noteResults = notes.map((note) => scoreContextItem(
    `note:${note.path}`,
    note.title,
    'Obsidian',
    `${note.title} ${note.content}`,
  ));
  const memoryResults = memories.map((memory) => scoreContextItem(
    `memory:${memory.id}`,
    'Memoria local',
    memory.createdAt,
    memory.content,
  ));

  return [...noteResults, ...memoryResults]
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);

  function scoreContextItem(
    id: string,
    title: string,
    source: string,
    content: string,
  ): ContextResult {
    const contentTokens = tokenize(content);
    const score = queryTokens.reduce(
      (total, token) => total + contentTokens.filter((item) => item === token).length,
      0,
    );

    return {
      id,
      title,
      source,
      score,
      preview: content.slice(0, 180),
    };
  }
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function loadEnabledPlugins(): string[] {
  const stored = localStorage.getItem('jarvis.plugins.enabled');
  if (!stored) {
    return ['jarvis.mock-provider', 'jarvis.git', 'jarvis.obsidian'];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function verifyPlugin(
  plugin: PluginManifest,
  permissions: Record<PermissionId, boolean>,
): { allowed: boolean; reason: string } {
  if (plugin.valid === false) {
    return { allowed: false, reason: `Plugin invalido: ${plugin.name}` };
  }

  if (plugin.permissions.includes('commands.execute')) {
    return { allowed: false, reason: 'Plugins ainda nao podem executar comandos locais.' };
  }

  if (plugin.permissions.includes('secrets.read') && !permissions.secrets) {
    return { allowed: false, reason: 'Permissao de secrets nao autorizada neste workspace.' };
  }

  if (plugin.permissions.includes('network.request') && !permissions.network) {
    return { allowed: false, reason: 'Permissao de rede nao autorizada neste workspace.' };
  }

  if (plugin.permissions.includes('git.write') && !permissions.git) {
    return { allowed: false, reason: 'Permissao Git nao autorizada neste workspace.' };
  }

  return { allowed: true, reason: 'Plugin verificado.' };
}

function createAgentDiff(tab: EditorTab) {
  const filePath = tab.path === welcomeTab.path ? 'novo-arquivo.ts' : tab.path;
  return [
    `diff --git a/${shortPath(filePath)} b/${shortPath(filePath)}`,
    `--- a/${shortPath(filePath)}`,
    `+++ b/${shortPath(filePath)}`,
    '@@',
    '+// Proposta do Agente Desenvolvedor:',
    '+// revisar este arquivo e adicionar testes antes de aplicar.',
    tab.content
      .split('\n')
      .slice(0, 8)
      .map((line) => ` ${line}`)
      .join('\n'),
  ].join('\n');
}

function createReview(tab: EditorTab) {
  return [
    `Revisao do arquivo: ${tab.name}`,
    '',
    '- Verificar caminhos de erro antes de aplicar alteracoes.',
    '- Adicionar teste para o fluxo principal alterado.',
    '- Confirmar se a mudanca nao expande permissao sensivel sem aprovacao.',
  ].join('\n');
}

function createDocumentationProposal(tab: EditorTab) {
  return [
    `Proposta de documentacao para ${tab.name}`,
    '',
    '## Contexto',
    'Descrever objetivo do arquivo e principais contratos usados.',
    '',
    '## Cuidados',
    'Registrar permissoes, dependencias externas e impacto no workspace.',
  ].join('\n');
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
