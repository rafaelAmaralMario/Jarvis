import { useEffect, useRef, useCallback } from 'react';
import type {
  JarvisBridge, ModuleInfo, Note, SearchResult, FileEntry,
  ModelInfo, ModelDetail, Agent,
  OrchestrationConfig, AgentTrace,
  Backlink, GraphData, FolderEntry, Project, EditorTabInfo,
  GitStatusEntry, GitBranch, GitLogEntry, GitGutterLine,
  LLMProviderInfo, LLMTestResult, LLMGenerateResponse,
  MCPServerInfo, MCPServerDetail, MCPToolInfo, MCPCallResult,
  WorkflowSummary, WorkflowDetail, WorkflowExecutionResult,
  PermissionInfo, AuditEntry, SecretInfo, ModelServerStatus, UpdateStatus,
  ConversationSummary, ChatMessage,
  ToolDefinition, ToolCallResult, ToolAgentResponse, ToolAgentAnswerResult,
  StreamTask, StreamState,
} from '@/types';

declare global {
  interface Window {
    qt?: {
      webChannelTransport: {
        send(message: string): void;
        onmessage: ((message: string) => void) | null;
      };
    };
    pywebview?: {
      api: Record<string, (...args: unknown[]) => Promise<unknown>>;
    };
    jarvis?: JarvisBridge;
  }
}

let bridgeInstance: JarvisBridge | null = null;

function createBridge(): JarvisBridge {
  const callbacks = new Map<string, Set<(data: unknown) => void>>();
  let requestId = 0;
  const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  const FALLBACKS: Record<string, unknown> = {
  checkConnection: false,
  getVersion: '0.1.0',
  getModules: [],
  listModels: [],
  getRoots: [],
  listFiles: [],
  getRecentFiles: [],
  listMCPServers: [],
  workflowList: [],
  securityGetPermissions: [],
  securityGetAuditLog: [],
  securityListSecrets: [],
  getModelServerStatus: { running: false, command: 'ollama serve', pid: 0, error: '' },
  getPlatform: 'windows',
  getPathSeparator: '\\',
  getConfig: null,
  listChatHistory: [],
  loadChat: [],
  showFolderPicker: null,
  copyToClipboard: false,
  revealInExplorer: false,
  startModelServer: false,
  getRelativePath: '',
  getModelBySpecialty: null,
  listAgents: [],
  getDefaultAgent: null,
  getOrchestrationConfig: { strategy: 'auto', maxRounds: 3 },
  getProjectInfo: null,
  getAppVersion: { version: '0.1.0', app_name: 'JARVIS' },
  checkForUpdates: { current_version: '0.1.0', latest_version: '', update_available: false, releases: [], error: '' },
  getAvailableVersions: [],
  downloadAndInstall: { success: false, error: 'No bridge available', restart: false },
  sendMessage: '**Erro:** Backend não disponível. Inicie o aplicativo Python para usar o chat.',
  chatListConversations: [],
  chatGetMessages: [],
  chatCreateConversation: { id: '', title: 'Nova conversa', model: '', createdAt: '', updatedAt: '', messageCount: 0 },
  chatSaveMessage: { id: '', role: 'user', content: '', tokensUsed: 0, latencyMs: 0, createdAt: '' },
  chatDeleteConversation: false,
  chatAutoTitle: '',
  toolsList: [],
  toolsGetRisk: 'danger',
  toolsExecute: { success: false, error: 'No bridge available', output: '', data: null },
  toolsSetWorkspace: false,
  toolAgentExecute: { content: '**Erro:** Backend não disponível.', toolCalls: [], toolResults: [], conversationId: '' },
  toolAgentAnswer: { success: false, content: '**Erro:** Backend não disponível.', error: 'Backend not available' },
  toolAgentExecuteStream: { taskId: '' },
  toolAgentGetStream: { content: '', toolCalls: [], toolResults: [], cancelled: false, done: true, error: null },
  aiGenerateAgent: { error: 'Backend not available' },
  aiGenerateWorkflow: { error: 'Backend not available' },
};

function send(method: string, ...args: unknown[]): Promise<unknown> {
  return new Promise((resolve) => {
    const id = String(++requestId);
    pending.set(id, { resolve, reject: () => resolve(FALLBACKS[method]) });

    const msg = JSON.stringify({ id, method, args });

    if (window.qt?.webChannelTransport) {
      window.qt.webChannelTransport.send(msg);
      return;
    }

    const api = window.pywebview?.api ?? window.jarvis as unknown as Record<string, (...a: unknown[]) => Promise<unknown>> | undefined;
    if (api?.[method]) {
      api[method](...args).then(resolve).catch(() => resolve(FALLBACKS[method]));
      return;
    }

    resolve(FALLBACKS[method]);
  });
}

  function handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id)!;
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error));
        else p.resolve(msg.result);
      } else if (msg.event && callbacks.has(msg.event)) {
        for (const cb of callbacks.get(msg.event)!) {
          cb(msg.data);
        }
      }
    } catch { /* ignore */ }
  }

  if (window.qt?.webChannelTransport) {
    window.qt.webChannelTransport.onmessage = (raw: string) => handleMessage(raw);
  }

  const bridge: JarvisBridge = {
    getModules: () => send('getModules') as Promise<ModuleInfo[]>,
    getModule: (id) => send('getModule', id) as Promise<ModuleInfo | null>,
    searchNotes: (query) => send('searchNotes', query) as Promise<SearchResult[]>,
    getNote: (id) => send('getNote', id) as Promise<Note | null>,
    listNotes: (folder) => send('listNotes', folder) as Promise<Note[]>,
    createNote: (data) => send('createNote', data) as Promise<Note>,
    updateNote: (id, data) => send('updateNote', id, data) as Promise<Note>,
    deleteNote: (id) => send('deleteNote', id) as Promise<boolean>,
    getBacklinks: (noteId) => send('getBacklinks', noteId) as Promise<Backlink[]>,
    getGraph: () => send('getGraph') as Promise<GraphData>,
    getFolders: () => send('getFolders') as Promise<FolderEntry[]>,
    moveNote: (id, folder) => send('moveNote', id, folder) as Promise<boolean>,
    importNote: (filePath) => send('importNote', filePath) as Promise<Note>,
    exportNote: (noteId, outputPath) => send('exportNote', noteId, outputPath) as Promise<boolean>,
    readFile: (path) => send('readFile', path) as Promise<string>,
    writeFile: (path, content) => send('writeFile', path, content) as Promise<boolean>,
    listDirectory: (path) => send('listDirectory', path) as Promise<FileEntry[]>,
    listFiles: (path) => send('listFiles', path) as Promise<FileEntry[]>,

    sendMessage: (input, _onToken) => send('sendMessage', input) as Promise<string>,
    cancelGeneration: () => { void send('cancelGeneration'); },

    listModels: () => send('listModels') as Promise<ModelInfo[]>,
    getModel: (name) => send('getModel', name) as Promise<ModelDetail | null>,
    pullModel: (name) => send('pullModel', name) as Promise<boolean>,
    deleteModel: (name) => send('deleteModel', name) as Promise<boolean>,
    startModel: (name) => send('startModel', name) as Promise<boolean>,
    stopModel: (name) => send('stopModel', name) as Promise<boolean>,
    updateModelMetadata: (name, meta) => send('updateModelMetadata', name, meta) as Promise<boolean>,
    getModelBySpecialty: (specialty) => send('getModelBySpecialty', specialty) as Promise<ModelDetail | null>,

    listAgents: () => send('listAgents') as Promise<Agent[]>,
    getAgent: (id) => send('getAgent', id) as Promise<Agent | null>,
    createAgent: (data) => send('createAgent', data) as Promise<Agent>,
    updateAgent: (id, data) => send('updateAgent', id, data) as Promise<Agent>,
    deleteAgent: (id) => send('deleteAgent', id) as Promise<boolean>,
    setDefaultAgent: (id) => send('setDefaultAgent', id) as Promise<boolean>,
    getDefaultAgent: () => send('getDefaultAgent') as Promise<Agent | null>,
    getOrchestrationPool: () => send('getOrchestrationPool') as Promise<Agent[]>,
    aiGenerateAgent: (prompt) => send('aiGenerateAgent', prompt) as Promise<Record<string, unknown>>,

    getOrchestrationConfig: () => send('getOrchestrationConfig') as Promise<OrchestrationConfig>,
    updateOrchestrationConfig: (config) => send('updateOrchestrationConfig', config) as Promise<boolean>,
    executeOrchestratedQuery: (query) => send('executeOrchestratedQuery', query) as Promise<string>,
    getAgentTrace: (queryId) => send('getAgentTrace', queryId) as Promise<AgentTrace | null>,

    openWorkspace: (path) => send('openWorkspace', path) as Promise<boolean>,
    addRoot: (path) => send('addRoot', path) as Promise<boolean>,
    removeRoot: (path) => send('removeRoot', path) as Promise<boolean>,
    getRoots: () => send('getRoots') as Promise<string[]>,
    createFile: (name, parentDir) => send('createFile', name, parentDir) as Promise<boolean>,
    createDirectory: (name, parentDir) => send('createDirectory', name, parentDir) as Promise<boolean>,
    deletePath: (path) => send('deletePath', path) as Promise<boolean>,
    renamePath: (oldPath, newName) => send('renamePath', oldPath, newName) as Promise<boolean>,
    movePath: (path, targetDir) => send('movePath', path, targetDir) as Promise<boolean>,
    getRecentFiles: (limit) => send('getRecentFiles', limit) as Promise<FileEntry[]>,
    getProjectInfo: (rootPath) => send('getProjectInfo', rootPath) as Promise<Project>,

    editorOpenFile: (path) => send('editorOpenFile', path) as Promise<EditorTabInfo | null>,
    editorSaveFile: (path, content) => send('editorSaveFile', path, content) as Promise<boolean>,
    editorCloseFile: (path) => send('editorCloseFile', path) as Promise<boolean>,
    editorGetOpenFiles: () => send('editorGetOpenFiles') as Promise<EditorTabInfo[]>,
    editorDetectLanguage: (filename) => send('editorDetectLanguage', filename) as Promise<string>,
    editorSearchFiles: (query) => send('editorSearchFiles', query) as Promise<FileEntry[]>,
    editorGetSettings: () => send('editorGetSettings') as Promise<Record<string, string>>,
    editorUpdateSettings: (key, value) => send('editorUpdateSettings', key, value) as Promise<boolean>,
    createFileWithPath: (fullPath) => send('createFileWithPath', fullPath) as Promise<boolean>,

    terminalCreate: () => send('terminalCreate') as Promise<string>,
    terminalWrite: (id, data) => send('terminalWrite', id, data) as Promise<boolean>,
    terminalResize: (id, cols, rows) => send('terminalResize', id, cols, rows) as Promise<boolean>,
    terminalClose: (id) => send('terminalClose', id) as Promise<boolean>,
    terminalCloseAll: () => send('terminalCloseAll') as Promise<boolean>,
    terminalList: () => send('terminalList') as Promise<string[]>,

    networkGet: (url, headers) => send('networkGet', url, headers) as Promise<{ statusCode: number; body: string }>,
    networkPost: (url, body, contentType, headers) => send('networkPost', url, body, contentType, headers) as Promise<{ statusCode: number; body: string }>,
    networkOAuthStart: (provider) => send('networkOAuthStart', provider) as Promise<string>,
    networkOAuthComplete: (provider, code) => send('networkOAuthComplete', provider, code) as Promise<string>,
    networkGetStoredToken: (provider) => send('networkGetStoredToken', provider) as Promise<string>,
    networkClearToken: (provider) => send('networkClearToken', provider) as Promise<boolean>,
    networkStoreApiKey: (service, key) => send('networkStoreApiKey', service, key) as Promise<boolean>,
    networkGetApiKey: (service) => send('networkGetApiKey', service) as Promise<string>,
    networkDeleteApiKey: (service) => send('networkDeleteApiKey', service) as Promise<boolean>,
    networkListApiKeys: () => send('networkListApiKeys') as Promise<{ service: string; key: string }[]>,

    gitStatus: (repoPath) => send('gitStatus', repoPath) as Promise<GitStatusEntry[]>,
    gitDiff: (repoPath, filePath) => send('gitDiff', repoPath, filePath) as Promise<string>,
    gitDiffGutter: (repoPath, filePath) => send('gitDiffGutter', repoPath, filePath) as Promise<GitGutterLine[]>,
    gitStage: (repoPath, filePath) => send('gitStage', repoPath, filePath) as Promise<boolean>,
    gitUnstage: (repoPath, filePath) => send('gitUnstage', repoPath, filePath) as Promise<boolean>,
    gitStageAll: (repoPath) => send('gitStageAll', repoPath) as Promise<boolean>,
    gitCommit: (repoPath, message) => send('gitCommit', repoPath, message) as Promise<boolean>,
    gitBranches: (repoPath) => send('gitBranches', repoPath) as Promise<GitBranch[]>,
    gitCheckout: (repoPath, branch) => send('gitCheckout', repoPath, branch) as Promise<boolean>,
    gitCreateBranch: (repoPath, branch) => send('gitCreateBranch', repoPath, branch) as Promise<boolean>,
    gitDeleteBranch: (repoPath, branch) => send('gitDeleteBranch', repoPath, branch) as Promise<boolean>,
    gitPush: (repoPath, remote, branch) => send('gitPush', repoPath, remote, branch) as Promise<boolean>,
    gitPull: (repoPath, remote, branch) => send('gitPull', repoPath, remote, branch) as Promise<boolean>,
    gitLog: (repoPath, count) => send('gitLog', repoPath, count) as Promise<GitLogEntry[]>,
    gitIsRepo: (repoPath) => send('gitIsRepo', repoPath) as Promise<boolean>,
    gitCurrentBranch: (repoPath) => send('gitCurrentBranch', repoPath) as Promise<string>,
    gitSetCredentials: (repoPath, username, token) => send('gitSetCredentials', repoPath, username, token) as Promise<boolean>,

    llmGetProviders: () => send('llmGetProviders') as Promise<LLMProviderInfo[]>,
    llmGetProvider: (provider) => send('llmGetProvider', provider) as Promise<LLMProviderInfo | null>,
    llmSaveProvider: (config) => send('llmSaveProvider', config) as Promise<boolean>,
    llmSetDefaultProvider: (provider) => send('llmSetDefaultProvider', provider) as Promise<boolean>,
    llmGetDefaultProvider: () => send('llmGetDefaultProvider') as Promise<string>,
    llmTestConnection: (provider) => send('llmTestConnection', provider) as Promise<LLMTestResult>,
    llmGenerate: (request) => send('llmGenerate', request) as Promise<LLMGenerateResponse>,

    mcpListServers: () => send('mcpListServers') as Promise<MCPServerInfo[]>,
    mcpGetServer: (id) => send('mcpGetServer', id) as Promise<MCPServerDetail | null>,
    mcpCreateServer: (data) => send('mcpCreateServer', data) as Promise<MCPServerDetail>,
    mcpUpdateServer: (id, data) => send('mcpUpdateServer', id, data) as Promise<MCPServerDetail>,
    mcpDeleteServer: (id) => send('mcpDeleteServer', id) as Promise<boolean>,
    mcpStartServer: (id) => send('mcpStartServer', id) as Promise<boolean>,
    mcpStopServer: (id) => send('mcpStopServer', id) as Promise<boolean>,
    mcpListTools: () => send('mcpListTools') as Promise<MCPToolInfo[]>,
    mcpCallTool: (serverId, toolName, callArgs) => send('mcpCallTool', serverId, toolName, callArgs) as Promise<MCPCallResult>,

    workflowList: () => send('workflowList') as Promise<WorkflowSummary[]>,
    workflowGet: (id) => send('workflowGet', id) as Promise<WorkflowDetail | null>,
    workflowCreate: (data) => send('workflowCreate', data) as Promise<WorkflowDetail>,
    workflowUpdate: (id, data) => send('workflowUpdate', id, data) as Promise<WorkflowDetail>,
    workflowDelete: (id) => send('workflowDelete', id) as Promise<boolean>,
    workflowExecute: (id, context) => send('workflowExecute', id, context) as Promise<WorkflowExecutionResult>,
    aiGenerateWorkflow: (prompt) => send('aiGenerateWorkflow', prompt) as Promise<Record<string, unknown>>,

    securityGetPermissions: () => send('securityGetPermissions') as Promise<PermissionInfo[]>,
    securityGetModulePermissions: (moduleId) => send('securityGetModulePermissions', moduleId) as Promise<PermissionInfo[]>,
    securitySetPermission: (moduleId, permission, granted) => send('securitySetPermission', moduleId, permission, granted) as Promise<boolean>,
    securityGetAuditLog: (module, limit, offset) => send('securityGetAuditLog', module, limit, offset) as Promise<AuditEntry[]>,
    securityStoreSecret: (key, value, category) => send('securityStoreSecret', key, value, category) as Promise<boolean>,
    securityGetSecret: (key) => send('securityGetSecret', key) as Promise<string>,
    securityDeleteSecret: (key) => send('securityDeleteSecret', key) as Promise<boolean>,
    securityListSecrets: (category) => send('securityListSecrets', category) as Promise<SecretInfo[]>,

    chatListConversations: () => send('chatListConversations') as Promise<ConversationSummary[]>,
    chatGetMessages: (convId) => send('chatGetMessages', convId) as Promise<ChatMessage[]>,
    chatCreateConversation: (title, agentId, model) => send('chatCreateConversation', title, agentId, model) as Promise<ConversationSummary>,
    chatSaveMessage: (convId, role, content, agentId, model, tokensUsed, latencyMs) => send('chatSaveMessage', convId, role, content, agentId, model, tokensUsed, latencyMs) as Promise<ChatMessage>,
    chatDeleteConversation: (convId) => send('chatDeleteConversation', convId) as Promise<boolean>,
    chatAutoTitle: (convId, firstMessage) => send('chatAutoTitle', convId, firstMessage) as Promise<string>,

    toolsList: () => send('toolsList') as Promise<ToolDefinition[]>,
    toolsGetRisk: (name) => send('toolsGetRisk', name) as Promise<string>,
    toolsExecute: (name, args) => send('toolsExecute', name, args) as Promise<ToolCallResult>,
    toolsSetWorkspace: (path) => send('toolsSetWorkspace', path) as Promise<boolean>,
    toolAgentExecute: (query, convId) => send('toolAgentExecute', query, convId) as Promise<ToolAgentResponse>,
    toolAgentAnswer: (questionId, answer) => send('toolAgentAnswer', questionId, answer) as Promise<ToolAgentAnswerResult>,
    toolAgentExecuteStream: (query, convId) => send('toolAgentExecuteStream', query, convId) as Promise<StreamTask>,
    toolAgentGetStream: (taskId) => send('toolAgentGetStream', taskId) as Promise<StreamState>,

    copyToClipboard: (text) => send('copyToClipboard', text) as Promise<boolean>,
    revealInExplorer: (path) => send('revealInExplorer', path) as Promise<boolean>,
    getRelativePath: (base, target) => send('getRelativePath', base, target) as Promise<string>,
    getPlatform: () => send('getPlatform') as Promise<string>,
    getPathSeparator: () => send('getPathSeparator') as Promise<string>,
    getModelServerStatus: () => send('getModelServerStatus') as Promise<ModelServerStatus>,
    startModelServer: () => send('startModelServer') as Promise<boolean>,
    showFolderPicker: () => send('showFolderPicker') as Promise<string | null>,
    getAppVersion: () => send('getAppVersion') as Promise<{ version: string; app_name: string }>,
    checkForUpdates: () => send('checkForUpdates') as Promise<UpdateStatus>,
    getAvailableVersions: () => send('getAvailableVersions') as Promise<string[]>,
    downloadAndInstall: (version) => send('downloadAndInstall', version) as Promise<{ success: boolean; path?: string; error?: string; restart?: boolean; message?: string }>,
    quitApp: () => { send('quitApp'); },

    onEvent: (event, cb) => {
      if (!callbacks.has(event)) callbacks.set(event, new Set());
      callbacks.get(event)!.add(cb);
    },
    offEvent: (event, cb) => {
      callbacks.get(event)?.delete(cb);
    },
  };

  return bridge;
}

export function useJarvis(): JarvisBridge {
  const ref = useRef<JarvisBridge | null>(null);

  if (!ref.current) {
    ref.current = bridgeInstance || (bridgeInstance = createBridge());
  }

  return ref.current;
}

export function useBridgeEvent<T = unknown>(event: string, handler: (data: T) => void) {
  const bridge = useJarvis();
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    bridge.onEvent(event, stableHandler as (data: unknown) => void);
    return () => bridge.offEvent(event, stableHandler as (data: unknown) => void);
  }, [bridge, event, stableHandler]);
}
