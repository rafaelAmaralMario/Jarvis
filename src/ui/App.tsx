import { useEffect, useMemo, useState } from 'react';

import { appMetadata } from '../application';
import { modelRegistry } from '../application/model-registry';
import { agentRegistry, type AgentDefinition } from '../agents';
import type { AiModel, ProviderKind } from '../domain';
import {
  createFile,
  createFolder,
  deleteEntry,
  getDefaultWorkspacePath,
  moveEntry,
  readTextFile,
  renameEntry,
  selectWorkspaceFolder,
  validatePath,
  type SearchResult,
  type WorkspaceEntry,
} from '../infrastructure/workspace';
import type { PluginManifest } from '../plugins';
import { pluginManifests } from '../plugins/manifests';
import type { EditorTab } from '../shared/types';
import type { ActivityView, BottomView } from './types';
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
  sidebarTitle,
  activityBarWidth,
  editorMinWidth,
  agentDesignerPath,
  welcomeTab,
} from '../ui/constants';
import { ActivityBar } from './components/ActivityBar';
import { FilesPanel } from './components/FilesPanel';
import { SearchPanel } from './components/SearchPanel';
import { GitPanel } from './components/GitPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { PluginsPanel } from './components/PluginsPanel';
import { ContextPanel } from './components/ContextPanel';
import { AgentsPanel } from './components/AgentsPanel';
import { HelpPanel } from './components/HelpPanel';
import { EditorPanel } from './components/EditorPanel';
import { ChatPanel } from './components/ChatPanel';
import { CommandPalette } from './components/CommandPalette';
import { ModalDialog } from './components/ModalDialog';
import { useLogs } from './hooks/useLogs';
import { useAudit } from './hooks/useAudit';
import { usePalette } from './hooks/usePalette';
import { useModals } from './hooks/useModals';
import { usePanelResize } from './hooks/usePanelResize';
import { useSettings } from './hooks/useSettings';
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
    chatMessagesRef, sendMessage: sendMessageHook, cancelGeneration,
  } = useChat(settings, secureApiKey, addLog);
  const {
    customAgents, setCustomAgents, agentForm, setAgentForm,
    agentCreationActive, setAgentCreationActive,
    hasAgentPermissions, runBrainAgent, createCustomAgent,
  } = useAgents({
    workspacePath,
    settings,
    secureApiKey,
    modelHealth,
    addLog,
    addAudit,
  });

  const availableModels = useMemo(
    () => mergeModelRegistry(modelRegistry.getAll(), localOllamaModels),
    [localOllamaModels],
  );
  const selectedModel = useMemo(
    () => availableModels.find((model) => model.id === settings.selectedModelId) ?? availableModels[0],
    [availableModels, settings.selectedModelId],
  );
  const activeVaultPath = settings.contextVaultKind === 'general'
    ? settings.generalVaultPath
    : settings.projectVaultPath;
  const allAgents = [...agentRegistry.getAll(), ...customAgents];
  const visiblePlugins: PluginManifest[] = [
    ...localPlugins.filter((p) => p.valid),
    ...pluginManifests,
  ];

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
      void runBrainAgent(agent, workspacePath, { renderWorkspaceTree, rawFiles: files }, gitFiles);
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

  return (
    <main
      className={`app-shell theme-${settings.theme}`}
      style={{
        gridTemplateColumns: `${activityBarWidth}px ${panelWidths.sidebar}px 4px minmax(${editorMinWidth}px, 1fr) 4px ${panelWidths.ai}px`,
      }}
    >
      <ActivityBar activeView={activeView} onActiveViewChange={setActiveView} />

      <section className="sidebar" aria-label="Painel lateral">
        <header className="panel-header">{sidebarTitle[activeView]}</header>
        {activeView === 'files' && (
          <FilesPanel
            workspacePath={workspacePath}
            files={files}
            workspaceLoadError={workspaceLoadError}
            expandedFolders={expandedFolders}
            selectedEntry={selectedEntry}
            onChooseWorkspace={chooseWorkspace}
            onOpenModal={openModal}
            onSetSelectedEntry={setSelectedEntry}
            onRefreshWorkspace={() => refreshWorkspace()}
            onOpenWorkspaceFile={openWorkspaceFile}
          />
        )}
        {activeView === 'search' && (
          <SearchPanel
            searchQuery={searchQuery}
            searchResults={searchResults}
            onSearchQueryChange={setSearchQuery}
            onRunSearch={runSearch}
            onLoadSearchResult={loadSearchResult}
          />
        )}
        {activeView === 'git' && (
          <GitPanel
            gitFiles={gitFiles}
            gitBranches={gitBranches}
            commitMessage={commitMessage}
            branchName={branchName}
            prUrl={prUrl}
            onRefreshWorkspace={() => refreshWorkspace()}
            onCommitMessageChange={setCommitMessage}
            onBranchNameChange={setBranchName}
            onSuggestCommitMessage={suggestCommitMessage}
            onCreateCommit={createCommit}
            onCreateBranch={createBranch}
            onCheckoutBranch={checkoutBranch}
            onCreatePullRequestUrl={createPullRequestUrl}
            onOpenDiff={openDiff}
            onStageFile={stageFile}
            onUnstageFile={unstageFile}
          />
        )}
        {activeView === 'settings' && (
          <SettingsPanel
            workspacePath={workspacePath}
            settings={settings}
            secureApiKey={secureApiKey}
            modelHealth={modelHealth}
            modelTestActive={modelTestActive}
            availableModels={availableModels}
            localOllamaModels={localOllamaModels}
            ollamaModelsError={ollamaModelsError}
            onChooseWorkspace={chooseWorkspace}
            onUpdateProviderKind={updateProviderKind}
            onSetSettings={setSettings}
            onSetSecureApiKey={setSecureApiKey}
            onTestSelectedModel={testSelectedModel}
            onStartSelectedOllamaModel={startSelectedOllamaModel}
            onRefreshOllamaModels={refreshOllamaModels}
            onPersistSecureApiKey={persistSecureApiKey}
            onLoadObsidianNotes={loadObsidianNotes}
            onUpdatePermission={updatePermission}
          />
        )}
        {activeView === 'plugins' && (
          <PluginsPanel
            visiblePlugins={visiblePlugins}
            enabledPlugins={enabledPlugins}
            onRefreshLocalPlugins={() => refreshLocalPlugins()}
            onTogglePlugin={togglePlugin}
          />
        )}
        {activeView === 'context' && (
          <ContextPanel
            contextQuery={contextQuery}
            contextResults={contextResults}
            memoryInput={memoryInput}
            memoryEntries={memoryEntries}
            notes={notes}
            activeVaultPath={activeVaultPath}
            contextVaultKind={settings.contextVaultKind}
            onContextQueryChange={setContextQuery}
            onMemoryInputChange={setMemoryInput}
            onRunContextSearch={runContextSearch}
            onAddMemory={addMemory}
            onWriteMemoryToObsidian={writeMemoryToObsidian}
          />
        )}
        {activeView === 'agents' && (
          <AgentsPanel
            allAgents={allAgents}
            modelHealth={modelHealth}
            onOpenAgentDesigner={openAgentDesigner}
            onRunAgent={runAgent}
          />
        )}
        {activeView === 'help' && (
          <HelpPanel
            providerKind={settings.providerKind}
            onStartSelectedOllamaModel={startSelectedOllamaModel}
          />
        )}
      </section>

      <div
        aria-label="Redimensionar menu lateral"
        className="panel-resizer sidebar-resizer"
        onPointerDown={(event) => startPanelResize('sidebar', event)}
        role="separator"
      />

      <EditorPanel
        appName={appMetadata.name}
        appDescription={appMetadata.description}
        selectedModelName={selectedModel.name}
        tabs={tabs}
        activeTab={activeTab}
        settingsTheme={settings.theme}
        agentForm={agentForm}
        modelHealth={modelHealth}
        agentCreationActive={agentCreationActive}
        bottomView={bottomView}
        diff={diff}
        selectedGitFile={selectedGitFile}
        logs={logs}
        auditEvents={auditEvents}
        proposalAccepted={proposalAccepted}
        onSetActiveTabPath={setActiveTabPath}
        onCloseTab={closeTab}
        onSaveActiveFile={saveActiveFile}
        onUpdateActiveTab={updateActiveTab}
        onSetAgentForm={setAgentForm}
        onCreateCustomAgent={() => createCustomAgent(agentDesignerPath, welcomeTab.path, setTabs, setActiveTabPath)}
        onOpenPalette={() => setPaletteOpen(true)}
        onBottomViewChange={setBottomView}
        onAcceptProposal={acceptProposal}
      />

      <div
        aria-label="Redimensionar painel de IA"
        className="panel-resizer ai-resizer"
        onPointerDown={(event) => startPanelResize('ai', event)}
        role="separator"
      />

      <ChatPanel
        messages={messages}
        chatInput={chatInput}
        generationActive={generationActive}
        chatMessagesRef={chatMessagesRef}
        onChatInputChange={setChatInput}
        onSendMessage={sendMessage}
        onCancelGeneration={cancelGeneration}
      />

      <CommandPalette
        paletteOpen={paletteOpen}
        paletteQuery={paletteQuery}
        filteredCommands={filteredCommands}
        onPaletteQueryChange={setPaletteQuery}
        onPaletteClose={() => setPaletteOpen(false)}
        onRunCommand={runCommand}
      />

      <ModalDialog
        modal={modal}
        modalValue={modalValue}
        onSubmitModal={submitModal}
        onCloseModal={closeModal}
        onModalValueChange={setModalValue}
      />
    </main>
  );
}
