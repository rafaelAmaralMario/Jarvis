import { useEffect, useRef, useCallback } from 'react';
import type {
  JarvisBridge, ModuleInfo, Note, SearchResult, FileEntry,
  ModelInfo, ModelDetail, Agent,
  OrchestrationConfig, AgentTrace,
  Backlink, GraphData, FolderEntry, Project, EditorTabInfo,
  GitStatusEntry, GitBranch, GitLogEntry, GitGutterLine
} from '@/types';

declare global {
  interface Window {
    qt?: {
      webChannelTransport: {
        send(message: string): void;
        onmessage: ((message: string) => void) | null;
      };
    };
    jarvis?: JarvisBridge;
  }
}

let bridgeInstance: JarvisBridge | null = null;

function createBridge(): JarvisBridge {
  const callbacks = new Map<string, Set<(data: unknown) => void>>();
  let requestId = 0;
  const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  function send(method: string, ...args: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = String(++requestId);
      pending.set(id, { resolve, reject });

      const msg = JSON.stringify({ id, method, args });

      if (window.qt?.webChannelTransport) {
        window.qt.webChannelTransport.send(msg);
      } else if (window.jarvis) {
        const svc = window.jarvis as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
        if (svc[method]) {
          svc[method](...args).then(resolve).catch(reject);
        }
      } else {
        reject(new Error('No bridge available'));
      }
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
