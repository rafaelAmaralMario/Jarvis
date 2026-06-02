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
  CircleHelp,
  Pencil,
  GitBranch,
  MoveRight,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { appMetadata } from '../application';
import { models } from '../application/model-registry';
import { agentDefinitions, type AgentDefinition } from '../agents';
import jarvisIcon from '../assets/jarvis-icon.svg';
import type { AiModel, ProviderKind } from '../domain';
import {
  createFile,
  createFolder,
  deleteEntry,
  getDefaultWorkspacePath,
  moveEntry,
  readTextFile,
  renameEntry,
  selectFolder,
  selectWorkspaceFolder,
  validatePath,
  writeTextFile,
  writeMarkdownNote,
  type GitBranch as GitBranchInfo,
  type GitFileStatus,
  type SearchResult,
  type WorkspaceEntry,
} from '../infrastructure/native';
import type { PluginManifest } from '../plugins';
import { pluginManifests } from '../plugins/manifests';
import type {
  ChatMessage,
  ActionLog,
  AuditEvent,
  MemoryEntry,
  ContextResult,
  EditorTab,
  ActivityView,
  BottomView,
  ContextVaultKind,
  SettingsState,
  PermissionId,
} from '../shared/types';
import {
  samePath,
  formatError,
  shortPath,
  directoryPath,
  languageFromPath,
  tabToEntry,
} from '../shared/utils';
import {
  loadWorkspaceMessages,
  loadWorkspaceAudit,
  loadWorkspaceMemory,
  saveWorkspaceMessages,
  saveWorkspaceAudit,
  saveWorkspaceMemory,
} from '../shared/persistence';
import {
  mergeModelRegistry,
  renderWorkspaceTree,
  createAgentDiff,
  createReview,
  createDocumentationProposal,
} from '../shared/helpers';
import {
  activityItems,
  sidebarTitle,
  bottomLabels,
  permissionItems,
  activityBarWidth,
  combinedResizerWidth,
  editorMinWidth,
  sidebarMinWidth,
  aiPanelMinWidth,
  agentDesignerPath,
  welcomeTab,
} from '../ui/constants';
import { TreeEntry } from '../ui/TreeEntry';
import { useLogs } from './hooks/useLogs';
import { useAudit } from './hooks/useAudit';
import { usePalette } from './hooks/usePalette';
import { useModals } from './hooks/useModals';
import { usePanelResize } from './hooks/usePanelResize';
import { useSettings, defaultSettings } from './hooks/useSettings';
import { useWorkspace } from './hooks/useWorkspace';
import { useGit } from './hooks/useGit';
import { useEditor } from './hooks/useEditor';
import { usePlugins } from './hooks/usePlugins';
import { useContextManager } from './hooks/useContextManager';
import { useChat } from './hooks/useChat';
import { useAgents } from './hooks/useAgents';

export function App() {
  const [activeView, setActiveView] = useState<ActivityView>('files');
  const [bottomView, setBottomView] = useState<BottomView>('logs');
  const [proposalAccepted, setProposalAccepted] = useState(false);

  const { logs, addLog } = useLogs();
  const { auditEvents, setAuditEvents, addAudit } = useAudit();
  const { paletteOpen, setPaletteOpen, paletteQuery, setPaletteQuery, filteredCommands } = usePalette();
  const { modal, setModal, modalValue, setModalValue, openModal, closeModal } = useModals();
  const {
    settings, setSettings, secureApiKey, setSecureApiKey,
    modelHealth, modelTestActive,
    localOllamaModels, ollamaModelsError,
    initializeSecureSettings, initializeOllamaModelsPath,
    persistSecureApiKey, updateProviderKind: updateProviderKindHook, updatePermission,
    testSelectedModel, startSelectedOllamaModel, refreshOllamaModels,
  } = useSettings(addLog, addAudit);
  const { panelWidths, startPanelResize } = usePanelResize(
    settings.sidebarWidth, settings.aiPanelWidth,
    (updater) => setSettings(updater as any),
  );
  const {
    workspacePath, setWorkspacePath,
    files, setFiles, workspaceLoadError,
    expandedFolders, setExpandedFolders, selectedEntry, setSelectedEntry,
    searchQuery, setSearchQuery, searchResults,
    initializeWorkspace, refreshWorkspace, toggleFolder, ensureFolderExpanded, runSearch: runSearchHook,
  } = useWorkspace(addLog);
  const {
    gitFiles, setGitFiles, gitBranches, setGitBranches,
    selectedGitFile,
    commitMessage, setCommitMessage, branchName, setBranchName,
    prUrl, diff, setDiff,
    openDiff, stageFile, unstageFile, createCommit: createCommitHook, suggestCommitMessage,
    createBranch: createBranchHook, checkoutBranch, createPullRequestUrl,
  } = useGit(workspacePath, addLog, addAudit, () => refreshWorkspace());
  const {
    tabs, setTabs, activeTabPath, setActiveTabPath,
    activeTab, dirtyTabs,
    updateActiveTab, closeTab: closeEditorTab, openFile, saveActiveFile: saveEditorFile,
  } = useEditor(workspacePath, addLog, { initialTabs: [welcomeTab], defaultTabPath: welcomeTab.path });
  const {
    enabledPlugins, setEnabledPlugins, localPlugins,
    togglePlugin: togglePluginHook, refreshLocalPlugins,
  } = usePlugins(addLog, addAudit);
  const {
    notes, setNotes, memoryEntries, setMemoryEntries, memoryInput, setMemoryInput,
    contextQuery, setContextQuery, contextResults,
    loadObsidianNotes: loadObsidianNotesHook, addMemory, runContextSearch, writeMemoryToObsidian: writeMemoryHook,
  } = useContextManager(workspacePath, addLog, addAudit);
  const {
    chatInput, setChatInput, messages, setMessages,
    generationActive, chatHydratedWorkspace, setChatHydratedWorkspace,
    chatMessagesRef, createCurrentTextProvider, sendMessage: sendMessageHook, cancelGeneration,
  } = useChat(settings, secureApiKey, addLog);
  const {
    customAgents, setCustomAgents, agentForm, setAgentForm,
    agentCreationActive, setAgentCreationActive,
  } = useAgents(workspacePath, settings, addLog, addAudit);

  const availableModels = useMemo(
    () => mergeModelRegistry(models, localOllamaModels),
    [localOllamaModels],
  );
  const selectedModel = useMemo(
    () => availableModels.find((model) => model.id === settings.selectedModelId) ?? availableModels[0],
    [availableModels, settings.selectedModelId],
  );
  const activeVaultPath = settings.contextVaultKind === 'general'
    ? settings.generalVaultPath
    : settings.projectVaultPath;
  const allAgents = [...agentDefinitions, ...customAgents];
  const visiblePlugins: PluginManifest[] = [
    ...pluginManifests.map((plugin) => ({ ...plugin, valid: true, source: 'builtin' })),
    ...localPlugins,
  ];

  useEffect(() => {
    void initializeWorkspace(
      settings.workspacePath,
      () => getDefaultWorkspacePath(),
      (path) => {
        setSettings((current) => ({ ...current, workspacePath: path }));
      },
    );
    void initializeSecureSettings();
    void initializeOllamaModelsPath();
  }, []);

  useEffect(() => {
    if (!workspacePath) {
      return;
    }

    setMessages(loadWorkspaceMessages(workspacePath));
    setChatHydratedWorkspace(workspacePath);
    setAuditEvents(loadWorkspaceAudit(workspacePath));
    setMemoryEntries(loadWorkspaceMemory(workspacePath));
    void refreshLocalPlugins(workspacePath);
  }, [workspacePath]);

  useEffect(() => {
    if (workspacePath && chatHydratedWorkspace === workspacePath) {
      saveWorkspaceMessages(workspacePath, messages);
    }
  }, [chatHydratedWorkspace, messages, workspacePath]);

  useEffect(() => {
    chatMessagesRef.current?.scrollTo({
      top: chatMessagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [generationActive, messages]);

  useEffect(() => {
    if (workspacePath) {
      saveWorkspaceAudit(workspacePath, auditEvents);
    }
  }, [auditEvents, workspacePath]);

  useEffect(() => {
    if (workspacePath) {
      saveWorkspaceMemory(workspacePath, memoryEntries);
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

  // JSX compatibility wrappers - delegate to hooks
  async function openWorkspaceFile(file: WorkspaceEntry) {
    setSelectedEntry(file);
    if (file.kind === 'directory') {
      toggleFolder(file.path);
      return;
    }
    await openFile(file, readTextFile, languageFromPath);
  }

  function saveActiveFile() {
    void saveEditorFile(() => refreshWorkspace(), [welcomeTab.path, agentDesignerPath]);
  }

  function togglePlugin(plugin: PluginManifest) {
    togglePluginHook(plugin, settings.permissions);
  }

  function closeTab(tab: EditorTab) {
    closeEditorTab(tab, (dirtyTab) => {
      openModal({ type: 'delete', title: `Fechar "${dirtyTab.name}" sem salvar?`, entry: tabToEntry(dirtyTab) });
    }, welcomeTab.path);
  }

  async function runSearch() {
    setActiveView('search');
    await runSearchHook(searchQuery);
  }

  async function loadObsidianNotes() {
    await loadObsidianNotesHook(activeVaultPath);
  }

  function writeMemoryToObsidian() {
    void writeMemoryHook(activeVaultPath, settings.contextVaultKind);
  }

  function createCommit() {
    void createCommitHook(commitMessage);
  }

  function createBranch() {
    void createBranchHook(branchName);
  }

  function updateProviderKind(providerKind: ProviderKind) {
    updateProviderKindHook(providerKind, availableModels);
  }

  function sendMessage() {
    void sendMessageHook(chatInput);
  }

  function openAgentDesigner() {
    const existing = tabs.find((tab) => tab.path === agentDesignerPath);
    if (existing) {
      setActiveTabPath(existing.path);
      return;
    }

    const tab: EditorTab = {
      path: agentDesignerPath,
      name: 'novo-agente',
      content: '',
      savedContent: '',
      language: 'plaintext',
    };
    setTabs((current) => [...current, tab]);
    setActiveTabPath(tab.path);
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

  async function submitModal() {
    if (!modal) {
      return;
    }

    try {
      const requiresValue = !['delete', 'switch-workspace'].includes(modal.type);
      if (requiresValue && !modalValue.trim()) {
        addLog('Informe um nome ou destino para continuar', 'warn');
        return;
      }

      if (modal.type === 'create-file') {
        const parent = parentForNewEntry();
        await createFile(workspacePath, parent, modalValue.trim());
        ensureFolderExpanded(parent);
        addLog(`Arquivo criado: ${modalValue}`, 'ok');
      }
      if (modal.type === 'create-folder') {
        const parent = parentForNewEntry();
        await createFolder(workspacePath, parent, modalValue.trim());
        ensureFolderExpanded(parent);
        addLog(`Pasta criada: ${modalValue}`, 'ok');
      }
      if (modal.type === 'rename') {
        await renameEntry(workspacePath, modal.entry.path, modalValue.trim());
        addLog(`Renomeado: ${modal.entry.name} -> ${modalValue}`, 'ok');
      }
      if (modal.type === 'move') {
        await moveEntry(workspacePath, modal.entry.path, modalValue.trim());
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
          setTabs((current) => current.filter((tab) => !samePath(tab.path, modal.entry.path)));
          if (samePath(activeTab.path, modal.entry.path)) {
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
    if (!selectedEntry) {
      return workspacePath;
    }

    return selectedEntry.kind === 'directory' ? selectedEntry.path : directoryPath(selectedEntry.path);
  }

  async function loadSearchResult(result: SearchResult) {
    const name = shortPath(result.path);
    await openFile(
      { name, path: result.path, kind: 'file' as const, children: [] },
      readTextFile,
      languageFromPath,
    );
  }

  function acceptProposal() {
    setProposalAccepted(true);
    addLog('Proposta mockada aceita para validacao do fluxo', 'ok');
    addAudit('Agente Desenvolvedor', 'write-workspace', activeTab.path, 'Proposta aceita pela UI');
  }

  function runCommand(command: string) {
    setPaletteOpen(false);
    setPaletteQuery('');
    if (command === 'open-folder') void chooseWorkspace();
    if (command === 'save-file') void saveActiveFile();
    if (command === 'search') setActiveView('search');
    if (command === 'settings') setActiveView('settings');
    if (command === 'help') setActiveView('help');
    if (command === 'toggle-theme') {
      setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }));
    }
  }

  function hasAgentPermissions(permissions: string[]) {
    return permissions.every((permission) => settings.permissions[permission as PermissionId]);
  }

  function runAgent(agentId: string) {
    const agent = allAgents.find((item) => item.id === agentId);
    if (!agent) {
      return;
    }

    if (!hasAgentPermissions(agent.permissions)) {
      addLog(`Permissoes insuficientes para o agente ${agent.name}`, 'warn');
      addAudit(agent.name, agent.permissions.join(', '), activeTab.path, 'Bloqueado por permissao');
      return;
    }

    if (agent.output === 'context') {
      void runProjectBrainAgent(agent);
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

  async function runProjectBrainAgent(agent: AgentDefinition) {
    if (!settings.projectVaultPath.trim()) {
      addLog('Informe o vault especifico do projeto antes de gerar o cerebro.', 'warn');
      return;
    }

    if (modelHealth !== 'ok') {
      addLog('Teste o modelo com sucesso antes de executar o agente de contexto.', 'warn');
      return;
    }

    try {
      const provider = createCurrentTextProvider();
      const prompt = [
        'Voce e um agente de arquitetura. Analise este projeto e gere uma nota Markdown para um vault Obsidian.',
        'Separe em secoes: visao geral, arquitetura, funcionalidades, agentes, modelos, integracoes, riscos e proximos passos.',
        'Use bullets objetivos e inclua caminhos importantes quando fizer sentido.',
        '',
        `Workspace: ${workspacePath}`,
        `Modelo: ${settings.selectedModelId}`,
        '',
        'Arvore de arquivos:',
        renderWorkspaceTree(files),
        '',
        'Mudancas Git:',
        gitFiles.map((file) => `- ${file.status} ${file.path}`).join('\n') || '- Nenhuma mudanca Git detectada.',
      ].join('\n');

      const content = await provider.sendMessage({
        input: prompt,
        modelId: settings.selectedModelId,
      });
      const title = `JARVIS Cerebro ${shortPath(workspacePath)} ${new Date().toISOString().slice(0, 10)}`;
      const notePath = await writeMarkdownNote(settings.projectVaultPath, title, content);
      addLog(`Cerebro do projeto criado: ${notePath}`, 'ok');
      addAudit(agent.name, 'read-workspace', settings.projectVaultPath, 'Contexto enviado ao Obsidian');
    } catch (error) {
      addLog(`Agente de contexto falhou: ${formatError(error)}`, 'warn');
    }
  }

  async function createCustomAgent() {
    if (modelHealth !== 'ok' || agentCreationActive) {
      return;
    }

    if (!agentForm.name.trim() || !agentForm.intent.trim()) {
      addLog('Informe nome e objetivo do agente.', 'warn');
      return;
    }

    setAgentCreationActive(true);
    try {
      const provider = createCurrentTextProvider();
      const response = await provider.sendMessage({
        input: [
          'Transforme a ideia abaixo em uma definicao curta de agente para uma IDE com IA.',
          'Responda em portugues com uma frase de objetivo clara e objetiva.',
          `Nome: ${agentForm.name}`,
          `Intencao: ${agentForm.intent}`,
        ].join('\n'),
        modelId: settings.selectedModelId,
      });
      const agent: AgentDefinition = {
        id: `custom-${crypto.randomUUID()}`,
        name: agentForm.name.trim(),
        goal: response.trim() || agentForm.intent.trim(),
        defaultModelCapability: 'text',
        permissions: agentForm.permissions,
        output: 'docs',
      };
      setCustomAgents((current) => [agent, ...current]);
      setAgentForm({ name: '', intent: '', permissions: ['read-workspace'] });
      setTabs((current) => current.filter((tab) => tab.path !== agentDesignerPath));
      setActiveTabPath(welcomeTab.path);
      addLog(`Agente criado: ${agent.name}`, 'ok');
    } catch (error) {
      addLog(`Nao foi possivel criar agente: ${formatError(error)}`, 'warn');
    } finally {
      setAgentCreationActive(false);
    }
  }

  return (
    <main
      className={`app-shell theme-${settings.theme}`}
      style={{
        gridTemplateColumns: `${activityBarWidth}px ${panelWidths.sidebar}px 4px minmax(${editorMinWidth}px, 1fr) 4px ${panelWidths.ai}px`,
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
            {workspaceLoadError && <div className="empty-state warning">{workspaceLoadError}</div>}
            {!workspaceLoadError && files.length === 0 && (
              <div className="empty-state">
                Nenhum arquivo encontrado nesta pasta. Use Atualizar ou selecione outra pasta.
              </div>
            )}
            {files.map((file) => (
              <TreeEntry
                entry={file}
                expandedFolders={expandedFolders}
                key={file.path}
                level={0}
                onCreateFile={(entry) => {
                  setSelectedEntry(entry);
                  openModal({ type: 'create-file', title: `Criar arquivo em ${entry.name}` });
                }}
                onCreateFolder={(entry) => {
                  setSelectedEntry(entry);
                  openModal({ type: 'create-folder', title: `Criar pasta em ${entry.name}` });
                }}
                onDelete={(entry) => {
                  setSelectedEntry(entry);
                  openModal({ type: 'delete', title: 'Remover item', entry });
                }}
                onOpen={(entry) => void openWorkspaceFile(entry)}
                onRename={(entry) => {
                  setSelectedEntry(entry);
                  openModal({ type: 'rename', title: 'Renomear', entry });
                }}
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
                {availableModels
                  .filter((model) => model.providerId === settings.providerKind)
                  .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button with-icon"
              disabled={modelTestActive}
              onClick={() => void testSelectedModel()}
              type="button"
            >
              <Sparkles size={15} />
              {modelTestActive ? 'Testando modelo...' : 'Testar modelo'}
            </button>
            <button
              className="text-button with-icon"
              disabled={settings.providerKind !== 'ollama'}
              onClick={() => void startSelectedOllamaModel()}
              type="button"
            >
              <Sparkles size={15} />
              Iniciar modelo selecionado
            </button>
            <div className={`status-line ${modelHealth}`}>
              Modelo: {modelHealth === 'ok' ? 'funcional' : modelHealth === 'fail' ? 'falhou no ultimo teste' : 'nao testado'}
            </div>
            {settings.providerKind === 'ollama' && (
              <>
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
                <label>
                  Pasta de modelos Ollama
                  <input
                    value={settings.ollamaModelsPath}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, ollamaModelsPath: event.target.value }))
                    }
                    placeholder="C:\\Users\\...\\.ollama\\models"
                  />
                </label>
                <div className="split-actions">
                  <button
                    className="text-button"
                    onClick={async () => {
                      const selected = await selectFolder('Selecionar pasta de modelos do Ollama');
                      if (selected) {
                        setSettings((current) => ({ ...current, ollamaModelsPath: selected }));
                        await refreshOllamaModels(selected);
                      }
                    }}
                    type="button"
                  >
                    Escolher pasta
                  </button>
                  <button className="text-button" onClick={() => void refreshOllamaModels()} type="button">
                    Detectar modelos
                  </button>
                </div>
                {ollamaModelsError && <div className="empty-state warning">{ollamaModelsError}</div>}
                {!ollamaModelsError && localOllamaModels.length > 0 && (
                  <div className="status-line ok">
                    Modelos locais: {localOllamaModels.join(', ')}
                  </div>
                )}
              </>
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
              Destino de contexto
              <select
                value={settings.contextVaultKind}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    contextVaultKind: event.target.value as ContextVaultKind,
                  }))
                }
              >
                <option value="general">Geral</option>
                <option value="project">Especifico do projeto</option>
              </select>
            </label>
            <label>
              Vault Obsidian geral
              <input
                value={settings.generalVaultPath}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, generalVaultPath: event.target.value }))
                }
                placeholder="C:\\Users\\...\\Vault-Geral"
              />
            </label>
            <label>
              Vault Obsidian do projeto
              <input
                value={settings.projectVaultPath}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, projectVaultPath: event.target.value }))
                }
                placeholder="C:\\Users\\...\\Vault-Projeto"
              />
            </label>
            <button className="primary-button" onClick={() => void loadObsidianNotes()} type="button">
              Validar e carregar notas do destino
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
            <div className="workspace-path">
              Destino ativo: {settings.contextVaultKind === 'general' ? 'Geral' : 'Projeto'} | {activeVaultPath || 'nao configurado'}
            </div>
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
            <article className="plugin-card">
              <strong>Criar novo agente</strong>
              <p>Disponivel depois que o modelo ativo passar no teste.</p>
              <button
                className="primary-button"
                disabled={modelHealth !== 'ok'}
                onClick={openAgentDesigner}
                type="button"
              >
                Novo agente
              </button>
            </article>
            {allAgents.map((agent) => (
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
        {activeView === 'help' && (
          <div className="panel-list help-panel">
            <article className="plugin-card">
              <strong>Instalar modelos locais com Ollama</strong>
              <ol>
                <li>Baixe o instalador oficial do Ollama para o seu sistema.</li>
                <li>No Windows, use o instalador OllamaSetup.exe.</li>
                <li>Abra o terminal e execute um modelo, por exemplo: ollama run llama3.2.</li>
                <li>Em Configuracoes, selecione Provider de IA: Ollama local.</li>
                <li>Confirme o endpoint http://127.0.0.1:11434 e clique em Testar modelo.</li>
              </ol>
              <a className="external-link" href="https://docs.ollama.com/" rel="noreferrer" target="_blank">
                Documentacao Ollama
              </a>
              <a className="external-link" href="https://docs.ollama.com/windows" rel="noreferrer" target="_blank">
                Instalar no Windows
              </a>
              <button
                className="primary-button with-icon"
                disabled={settings.providerKind !== 'ollama'}
                onClick={() => void startSelectedOllamaModel()}
                type="button"
              >
                <Sparkles size={15} />
                Iniciar modelo selecionado
              </button>
            </article>
            <article className="plugin-card">
              <strong>Usar OpenAI-compatible</strong>
              <ol>
                <li>Crie ou obtenha uma API key do provider escolhido.</li>
                <li>Configure o endpoint em formato OpenAI-compatible.</li>
                <li>Salve a chave em Configuracoes e clique em Testar modelo.</li>
              </ol>
              <a className="external-link" href="https://developers.openai.com/api/docs/quickstart" rel="noreferrer" target="_blank">
                Quickstart OpenAI API
              </a>
              <a className="external-link" href="https://platform.openai.com/docs/api-reference/authentication" rel="noreferrer" target="_blank">
                Autenticacao OpenAI API
              </a>
            </article>
            <article className="plugin-card">
              <strong>LM Studio como servidor local</strong>
              <ol>
                <li>Instale o LM Studio e baixe um modelo pela aba Discover.</li>
                <li>Ative o servidor local OpenAI-compatible.</li>
                <li>No JARVIS, use Provider OpenAI-compatible e informe o endpoint local.</li>
              </ol>
              <a className="external-link" href="https://lmstudio.ai/docs/app" rel="noreferrer" target="_blank">
                Documentacao LM Studio
              </a>
              <a className="external-link" href="https://www.lmstudio.ai/docs/app/offline" rel="noreferrer" target="_blank">
                Rodar offline e servidor local
              </a>
            </article>
            <article className="plugin-card">
              <strong>Agentes e contexto</strong>
              <ol>
                <li>Teste o modelo antes de criar novos agentes.</li>
                <li>Use o agente Cerebro do Projeto para gerar uma nota inicial no vault especifico.</li>
                <li>Use o vault Geral para conhecimento reaproveitavel e o vault do Projeto para decisoes locais.</li>
              </ol>
            </article>
          </div>
        )}
      </section>

      <div
        aria-label="Redimensionar menu lateral"
        className="panel-resizer sidebar-resizer"
        onPointerDown={(event) => startPanelResize('sidebar', event)}
        role="separator"
      />

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
              className={samePath(activeTab.path, tab.path) ? 'tab active' : 'tab'}
              key={tab.path}
              onClick={() => setActiveTabPath(tab.path)}
              onAuxClick={(event) => {
                if (event.button === 1 && tab.path !== welcomeTab.path) {
                  closeTab(tab);
                }
              }}
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
          {activeTab.path === agentDesignerPath ? (
            <section className="agent-designer">
              <div>
                <strong>Novo agente</strong>
                <span>O modelo ativo sera usado para refinar a definicao.</span>
              </div>
              <label>
                Nome
                <input
                  value={agentForm.name}
                  onChange={(event) => setAgentForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex.: Analista de requisitos"
                />
              </label>
              <label>
                O que ele deve fazer
                <textarea
                  value={agentForm.intent}
                  onChange={(event) => setAgentForm((current) => ({ ...current, intent: event.target.value }))}
                  placeholder="Descreva a funcao do agente..."
                />
              </label>
              <div className="permission-grid">
                {permissionItems.map((permission) => (
                  <label className="toggle-row" key={permission.id}>
                    <span>
                      {permission.label}
                      <small>{permission.description}</small>
                    </span>
                    <input
                      checked={agentForm.permissions.includes(permission.id)}
                      onChange={(event) => {
                        setAgentForm((current) => ({
                          ...current,
                          permissions: event.target.checked
                            ? [...current.permissions, permission.id]
                            : current.permissions.filter((item) => item !== permission.id),
                        }));
                      }}
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>
              <button
                className="primary-button"
                disabled={modelHealth !== 'ok' || agentCreationActive}
                onClick={() => void createCustomAgent()}
                type="button"
              >
                {agentCreationActive ? 'Criando agente...' : 'Criar agente com IA'}
              </button>
            </section>
          ) : (
            <Editor
              language={activeTab.language}
              height="100%"
              theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
              value={activeTab.content}
              onChange={(value) => updateActiveTab(value ?? '')}
              options={{ minimap: { enabled: false }, fontSize: 14, readOnly: false }}
            />
          )}
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

      <div
        aria-label="Redimensionar painel de IA"
        className="panel-resizer ai-resizer"
        onPointerDown={(event) => startPanelResize('ai', event)}
        role="separator"
      />

      <aside className="ai-panel" aria-label="Painel de IA">
        <header className="panel-header">IA</header>
        <div className="chat-messages" ref={chatMessagesRef}>
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
