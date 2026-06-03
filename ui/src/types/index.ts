export interface JarvisBridge {
  getModules(): Promise<ModuleInfo[]>;
  getModule(id: string): Promise<ModuleInfo | null>;

  searchNotes(query: string): Promise<SearchResult[]>;
  getNote(id: string): Promise<Note | null>;
  listNotes(folder?: string): Promise<Note[]>;
  createNote(data: CreateNoteDTO): Promise<Note>;
  updateNote(id: string, data: Partial<CreateNoteDTO>): Promise<Note>;
  deleteNote(id: string): Promise<boolean>;
  getBacklinks(noteId: string): Promise<Backlink[]>;
  getGraph(): Promise<GraphData>;
  getFolders(): Promise<FolderEntry[]>;
  moveNote(id: string, folder: string): Promise<boolean>;
  importNote(filePath: string): Promise<Note>;
  exportNote(noteId: string, outputPath: string): Promise<boolean>;

  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<boolean>;
  listDirectory(path: string): Promise<FileEntry[]>;
  listFiles(path: string): Promise<FileEntry[]>;

  sendMessage(input: string, onToken?: (token: string) => void): Promise<string>;
  cancelGeneration(): void;
  listModels(): Promise<ModelInfo[]>;
  getModel(name: string): Promise<ModelDetail | null>;
  pullModel(name: string): Promise<boolean>;
  deleteModel(name: string): Promise<boolean>;
  startModel(name: string): Promise<boolean>;
  stopModel(name: string): Promise<boolean>;
  updateModelMetadata(name: string, meta: Partial<ModelMetadata>): Promise<boolean>;
  getModelBySpecialty(specialty: string): Promise<ModelDetail | null>;

  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  createAgent(data: CreateAgentDTO): Promise<Agent>;
  updateAgent(id: string, data: Partial<CreateAgentDTO>): Promise<Agent>;
  deleteAgent(id: string): Promise<boolean>;
  setDefaultAgent(id: string): Promise<boolean>;
  getDefaultAgent(): Promise<Agent | null>;
  getOrchestrationPool(): Promise<Agent[]>;

  getOrchestrationConfig(): Promise<OrchestrationConfig>;
  updateOrchestrationConfig(config: Partial<OrchestrationConfig>): Promise<boolean>;
  executeOrchestratedQuery(query: string): Promise<string>;
  getAgentTrace(queryId: string): Promise<AgentTrace | null>;

  openWorkspace(path: string): Promise<boolean>;
  addRoot(path: string): Promise<boolean>;
  removeRoot(path: string): Promise<boolean>;
  getRoots(): Promise<string[]>;
  createFile(name: string, parentDir: string): Promise<boolean>;
  createDirectory(name: string, parentDir: string): Promise<boolean>;
  deletePath(path: string): Promise<boolean>;
  renamePath(oldPath: string, newName: string): Promise<boolean>;
  movePath(path: string, targetDir: string): Promise<boolean>;
  getRecentFiles(limit?: number): Promise<FileEntry[]>;
  getProjectInfo(rootPath: string): Promise<Project>;

  editorOpenFile(path: string): Promise<EditorTabInfo | null>;
  editorSaveFile(path: string, content: string): Promise<boolean>;
  editorCloseFile(path: string): Promise<boolean>;
  editorGetOpenFiles(): Promise<EditorTabInfo[]>;
  editorDetectLanguage(filename: string): Promise<string>;
  editorSearchFiles(query: string): Promise<FileEntry[]>;
  editorGetSettings(): Promise<Record<string, string>>;
  editorUpdateSettings(key: string, value: string): Promise<boolean>;
  createFileWithPath(fullPath: string): Promise<boolean>;

  terminalCreate(): Promise<string>;
  terminalWrite(id: string, data: string): Promise<boolean>;
  terminalResize(id: string, cols: number, rows: number): Promise<boolean>;
  terminalClose(id: string): Promise<boolean>;
  terminalCloseAll(): Promise<boolean>;
  terminalList(): Promise<string[]>;

  networkGet(url: string, headers?: Record<string, string>): Promise<{ statusCode: number; body: string }>;
  networkPost(url: string, body: string, contentType?: string, headers?: Record<string, string>): Promise<{ statusCode: number; body: string }>;
  networkOAuthStart(provider: string): Promise<string>;
  networkOAuthComplete(provider: string, code: string): Promise<string>;
  networkGetStoredToken(provider: string): Promise<string>;
  networkClearToken(provider: string): Promise<boolean>;
  networkStoreApiKey(service: string, key: string): Promise<boolean>;
  networkGetApiKey(service: string): Promise<string>;
  networkDeleteApiKey(service: string): Promise<boolean>;
  networkListApiKeys(): Promise<{ service: string; key: string }[]>;

  onEvent(event: string, callback: (data: unknown) => void): void;
  offEvent(event: string, callback: (data: unknown) => void): void;
}

export interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  state: 'discovered' | 'loaded' | 'initialized' | 'active' | 'shutdown' | 'error';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  createdAt: string;
  updatedAt: string;
  metadata?: string;
}

export interface CreateNoteDTO {
  title: string;
  content?: string;
  folder?: string;
  tags?: string[];
  metadata?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export interface Backlink {
  noteId: string;
  title: string;
  context: string;
}

export interface FolderEntry {
  path: string;
  name: string;
  noteCount: number;
}

export interface GraphNode {
  id: string;
  label: string;
  folder: string;
  tags: string[];
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  linkType: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NoteTreeItem {
  id: string;
  label: string;
  type: 'folder' | 'note';
  children?: NoteTreeItem[];
  note?: Note;
}

export interface FileEntry {
  name: string;
  path: string;
  fullPath?: string;
  relativePath?: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: string;
  children?: FileEntry[];
}

export interface Project {
  id: string;
  name: string;
  rootPath: string;
  version: string;
  type: string;
  folders: string[];
}

export interface FileEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

export interface ModelDetail {
  name: string;
  specialty: Specialty;
  status: 'downloaded' | 'running' | 'stopped' | 'error' | 'not_downloaded';
  size: string;
  modified: string;
  description: string;
  color: string;
  icon: string;
  errorMessage?: string;
}

export type Specialty = 'chat' | 'code' | 'reasoning' | 'embedding' | 'vision' | 'general';

export interface ModelMetadata {
  specialty: Specialty;
  notes: string;
  color: string;
  icon: string;
}

export const SPECIALTY_CONFIG: Record<Specialty, { label: string; icon: string; color: string }> = {
  chat: { label: 'Chat', icon: '💬', color: '#58a6ff' },
  code: { label: 'Code', icon: '💻', color: '#3fb950' },
  reasoning: { label: 'Reasoning', icon: '🧠', color: '#a371f7' },
  embedding: { label: 'Embedding', icon: '📐', color: '#d29922' },
  vision: { label: 'Vision', icon: '👁', color: '#f778ba' },
  general: { label: 'General', icon: '🤖', color: '#8b949e' },
};

export const SPECIALTIES: Specialty[] = ['chat', 'code', 'reasoning', 'embedding', 'vision', 'general'];

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  specialty: string;
  tools: string[];
  isDefault: boolean;
  canOrchestrate: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentDTO {
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  specialty?: string;
  tools?: string[];
  canOrchestrate?: boolean;
  priority?: number;
}

export interface OrchestrationConfig {
  enabled: boolean;
  orchestratorModel: string;
  criticEnabled: boolean;
  criticTemperature: number;
  maxAgentsPerQuery: number;
  showTrace: boolean;
}

export interface AgentTrace {
  queryId: string;
  query: string;
  orchestratorReasoning: string;
  agentsConsulted: AgentResult[];
  criticReview: string;
  finalResponse: string;
}

export interface AgentResult {
  agentName: string;
  specialty: string;
  model: string;
  response: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface EditorTabInfo {
  path: string;
  language: string;
  content?: string;
  size: number;
  lastModified: number;
  isDirty: boolean;
}

export type ActivityView = 'knowledge' | 'ide' | 'editor' | 'ai' | 'automation' | 'settings';
export type SettingsTab = 'general' | 'models' | 'assistant' | 'orchestration' | 'agents' | 'api-keys';
