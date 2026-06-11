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
  aiGenerateAgent(prompt: string): Promise<Record<string, unknown>>;

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

  gitStatus(repoPath: string): Promise<GitStatusEntry[]>;
  gitDiff(repoPath: string, filePath: string): Promise<string>;
  gitDiffGutter(repoPath: string, filePath: string): Promise<GitGutterLine[]>;
  gitStage(repoPath: string, filePath: string): Promise<boolean>;
  gitUnstage(repoPath: string, filePath: string): Promise<boolean>;
  gitStageAll(repoPath: string): Promise<boolean>;
  gitCommit(repoPath: string, message: string): Promise<boolean>;
  gitBranches(repoPath: string): Promise<GitBranch[]>;
  gitCheckout(repoPath: string, branch: string): Promise<boolean>;
  gitCreateBranch(repoPath: string, branch: string): Promise<boolean>;
  gitDeleteBranch(repoPath: string, branch: string): Promise<boolean>;
  gitPush(repoPath: string, remote?: string, branch?: string): Promise<boolean>;
  gitPull(repoPath: string, remote?: string, branch?: string): Promise<boolean>;
  gitLog(repoPath: string, count?: number): Promise<GitLogEntry[]>;
  gitIsRepo(repoPath: string): Promise<boolean>;
  gitCurrentBranch(repoPath: string): Promise<string>;
  gitSetCredentials(repoPath: string, username: string, token: string): Promise<boolean>;

  llmGetProviders(): Promise<LLMProviderInfo[]>;
  llmGetProvider(provider: string): Promise<LLMProviderInfo | null>;
  llmSaveProvider(config: LLMProviderConfig): Promise<boolean>;
  llmSetDefaultProvider(provider: string): Promise<boolean>;
  llmGetDefaultProvider(): Promise<string>;
  llmTestConnection(provider: string): Promise<LLMTestResult>;
  llmGenerate(request: LLMGenerateRequest): Promise<LLMGenerateResponse>;

  mcpListServers(): Promise<MCPServerInfo[]>;
  mcpGetServer(id: string): Promise<MCPServerDetail | null>;
  mcpCreateServer(data: MCPServerInput): Promise<MCPServerDetail>;
  mcpUpdateServer(id: string, data: Partial<MCPServerInput>): Promise<MCPServerDetail>;
  mcpDeleteServer(id: string): Promise<boolean>;
  mcpStartServer(id: string): Promise<boolean>;
  mcpStopServer(id: string): Promise<boolean>;
  mcpListTools(): Promise<MCPToolInfo[]>;
  mcpCallTool(serverId: string, toolName: string, args: Record<string, unknown>): Promise<MCPCallResult>;

  workflowList(): Promise<WorkflowSummary[]>;
  workflowGet(id: string): Promise<WorkflowDetail | null>;
  workflowCreate(data: Record<string, unknown>): Promise<WorkflowDetail>;
  workflowUpdate(id: string, data: Record<string, unknown>): Promise<WorkflowDetail>;
  workflowDelete(id: string): Promise<boolean>;
  workflowExecute(id: string, context?: Record<string, unknown>): Promise<WorkflowExecutionResult>;
  aiGenerateWorkflow(prompt: string): Promise<Record<string, unknown>>;

  securityGetPermissions(): Promise<PermissionInfo[]>;
  securityGetModulePermissions(moduleId: string): Promise<PermissionInfo[]>;
  securitySetPermission(moduleId: string, permission: string, granted: boolean): Promise<boolean>;
  securityGetAuditLog(module?: string, limit?: number, offset?: number): Promise<AuditEntry[]>;
  securityStoreSecret(key: string, value: string, category?: string): Promise<boolean>;
  securityGetSecret(key: string): Promise<string>;
  securityDeleteSecret(key: string): Promise<boolean>;
  securityListSecrets(category?: string): Promise<SecretInfo[]>;

  chatListConversations(): Promise<ConversationSummary[]>;
  chatGetMessages(convId: string): Promise<ChatMessage[]>;
  chatCreateConversation(title?: string, agentId?: string, model?: string): Promise<ConversationSummary>;
  chatSaveMessage(convId: string, role: string, content: string, agentId?: string, model?: string, tokensUsed?: number, latencyMs?: number): Promise<ChatMessage>;
  chatDeleteConversation(convId: string): Promise<boolean>;
  chatAutoTitle(convId: string, firstMessage: string): Promise<string>;

  toolsList(): Promise<ToolDefinition[]>;
  toolsGetRisk(name: string): Promise<string>;
  toolsExecute(name: string, args: Record<string, unknown>): Promise<ToolCallResult>;
  toolsSetWorkspace(path: string): Promise<boolean>;
  toolAgentExecute(query: string, convId?: string): Promise<ToolAgentResponse>;
  toolAgentAnswer(questionId: string, answer: string): Promise<ToolAgentAnswerResult>;
  toolAgentExecuteStream(query: string, convId?: string, history?: {role: string; content: string}[], agentId?: string, unattended?: boolean): Promise<StreamTask>;
  toolAgentGetStream(taskId: string): Promise<StreamState>;
  taskPlannerExecute(query: string, resume?: boolean): Promise<TaskPlannerResult>;
  plannerExecuteStream(query: string, resumePlanId?: string): Promise<{ taskId: string }>;
  plannerGetProgress(taskId: string): Promise<PlannerProgress>;
  plannerCancel(taskId: string): Promise<{ success: boolean }>;
  plannerListCheckpoints(): Promise<PlannerCheckpoint[]>;
  plannerResumeCheckpoint(planId: string): Promise<{ taskId: string }>;

  selfImprovementStream(action?: string): Promise<StreamTask>;
  selfImprovementGetStream(taskId: string): Promise<SIProgress>;
  selfImprovementAnswer(questionId: string, answer: string): Promise<{ success: boolean }>;
  selfImprovementCancel(taskId: string): Promise<{ success: boolean }>;

  llmGetFallbackConfig(provider?: string): Promise<LLMFallbackConfig[] | LLMFallbackConfig | null>;
  llmSaveFallbackConfig(config: LLMFallbackConfig): Promise<boolean>;

  ggufDownload(repoId: string, filename: string): Promise<{ success: boolean; path?: string; error?: string }>;
  ggufList(): Promise<GGUFModelInfo[]>;
  ggufDelete(name: string): Promise<{ success: boolean }>;
  ggufCatalog(): Promise<GGUFModelCatalog[]>;
  ggufDiskUsage(): Promise<{ totalBytes: number; count: number; modelsDir: string }>;

  audioTranscribe(audioBase64: string, model?: string): Promise<AudioTranscribeResult>;

  llmRouterGetRules(): Promise<RouterRule[]>;
  llmRouterSaveRule(rule: RouterRule): Promise<boolean>;
  llmRouterDeleteRule(name: string): Promise<boolean>;
  llmRouterGetMetrics(): Promise<ProviderMetrics[]>;
  llmRouterClearCache(): Promise<{ cleared: number }>;
  llmRouterGetCacheInfo(): Promise<RouterCacheInfo>;

  copyToClipboard(text: string): Promise<boolean>;
  revealInExplorer(path: string): Promise<boolean>;
  getRelativePath(base: string, target: string): Promise<string>;
  getPlatform(): Promise<string>;
  getPathSeparator(): Promise<string>;
  getModelServerStatus(): Promise<ModelServerStatus>;
  startModelServer(): Promise<boolean>;
  showFolderPicker(): Promise<string | null>;
  getAppVersion(): Promise<{ version: string; app_name: string }>;
  checkForUpdates(): Promise<UpdateStatus>;
  getAvailableVersions(): Promise<string[]>;
  downloadAndInstall(version: string): Promise<{ success: boolean; path?: string; error?: string; restart?: boolean; message?: string }>;
  quitApp(): void;

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
  provider: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  specialty: string;
  tools: string[];
  isDefault: boolean;
  canOrchestrate: boolean;
  priority: number;
  isBuiltin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentDTO {
  name: string;
  description?: string;
  model: string;
  provider?: string;
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

export interface GitStatusEntry {
  path: string;
  status: string;
  staged: boolean;
  isUntracked: boolean;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
}

export interface GitLogEntry {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

export interface GitGutterLine {
  line: number;
  type: 'a' | 'm' | 'd';
}

export interface EditorTabInfo {
  path: string;
  language: string;
  content?: string;
  size: number;
  lastModified: number;
  isDirty: boolean;
}

export interface LLMProviderInfo {
  provider: string;
  apiUrl: string;
  defaultModel: string;
  enabled: boolean;
  models: string[];
  hasKey: boolean;
}

export interface LLMProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  defaultModel?: string;
  enabled?: boolean;
  models?: string[];
}

export interface LLMTestResult {
  success: boolean;
  models?: string[];
  error?: string;
}

export interface LLMGenerateRequest {
  provider?: string;
  model?: string;
  messages: { role: string; content: string }[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateResponse {
  content: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  done: boolean;
}

export interface MCPServerInfo {
  id: string;
  name: string;
  transport: string;
  command: string;
  url: string;
  enabled: boolean;
  running: boolean;
}

export interface MCPServerDetail extends MCPServerInfo {
  args: string[];
  env: Record<string, string>;
}

export interface MCPServerInput {
  name: string;
  transport?: string;
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  serverId: string;
  serverName: string;
}

export interface MCPCallResult {
  success: boolean;
  content?: unknown;
  error?: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  enabled: boolean;
  stepCount: number;
  isBuiltin?: boolean;
}

export interface WorkflowDetail {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStep[];
  enabled: boolean;
  isBuiltin?: boolean;
}

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  nextOnSuccess?: string;
  nextOnFailure?: string;
}

export interface WorkflowInput {
  name: string;
  description?: string;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  steps?: WorkflowStep[];
  enabled?: boolean;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: string;
  trigger: string;
  startedAt: string;
  completedAt: string;
  results: WorkflowStepResult[];
  success: boolean;
}

export interface WorkflowStepResult {
  stepId: string;
  stepName: string;
  stepType: string;
  success: boolean;
  output?: unknown;
  error?: string;
}

export interface PermissionInfo {
  moduleId: string;
  permission: string;
  granted: boolean;
}

export interface AuditEntry {
  id: number;
  module: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface SecretInfo {
  key: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelServerStatus {
  running: boolean;
  command: string;
  pid: number;
  error: string;
}

export interface UpdateStatus {
  current_version: string;
  latest_version: string;
  update_available: boolean;
  releases: ReleaseInfo[];
  error: string;
}

export interface ReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  download_url: string;
  filename: string;
}

export interface ConversationSummary {
  id: string;
  agentId?: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  model?: string;
  tokensUsed: number;
  latencyMs: number;
  createdAt: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  risk: 'safe' | 'ask' | 'danger';
  examples: string[];
}

export interface ToolCallResult {
  success: boolean;
  output: string;
  error: string;
  data: Record<string, unknown> | null;
}

export interface ToolAgentCall {
  name: string;
  args: Record<string, unknown>;
  round: number;
}

export interface ToolAgentResult {
  name: string;
  args: Record<string, unknown>;
  success: boolean;
  output: string;
  error: string;
  round: number;
}

export interface PendingQuestion {
  questionId: string;
  question: string;
  toolName: string;
}

export interface ToolAgentResponse {
  content: string;
  toolCalls: ToolAgentCall[];
  toolResults: ToolAgentResult[];
  conversationId: string;
  pendingQuestion?: PendingQuestion | null;
  cancelled?: boolean;
}

export interface ToolAgentAnswerResult {
  success: boolean;
  content: string;
  error?: string;
  pendingQuestion?: PendingQuestion | null;
  cancelled?: boolean;
}

export interface StreamTask {
  taskId: string;
}

export interface StreamState {
  content: string;
  toolCalls: ToolAgentCall[];
  toolResults: ToolAgentResult[];
  pendingQuestion?: PendingQuestion | null;
  cancelled: boolean;
  done: boolean;
  error?: string | null;
}

export interface SIProgress {
  step: string;
  status: string;
  detail: string;
  progress: number;
  pendingQuestion?: PendingQuestion | null;
  cancelled: boolean;
  done: boolean;
  error?: string | null;
}

export interface GGUFModelInfo {
  name: string;
  sizeBytes: number;
  path: string;
  modifiedAt: string;
}

export interface RouterRule {
  name: string;
  match: {
    byModel: string[];
    byCapability: string[];
    byProvider: string[];
    maxCostPer1k: number;
  };
  providers: string[];
  priority: number;
  enabled: boolean;
}

export interface ProviderMetrics {
  provider: string;
  totalCalls: number;
  successCalls: number;
  avgLatencyMs: number;
  lastError: string;
  lastSuccessAt: string;
}

export interface RouterCacheInfo {
  size: number;
  maxSize: number;
}

export interface AudioTranscribeResult {
  success: boolean;
  text: string;
  error?: string;
}

export interface GGUFModelCatalog {
  name: string;
  repoId: string;
  filename: string;
  description: string;
  size: string;
}

export interface LLMFallbackConfig {
  provider: string;
  fallbackOrder: string[];
  timeoutSeconds: number;
  modelOverrides: { model: string; fallbackOrder: string[] }[];
}

export interface TaskPlannerStepResult {
  goal: string;
  success: boolean;
  output: string;
  error?: string;
  retries: number;
}

export interface TaskPlannerResult {
  success: boolean;
  task: string;
  plan_summary: string;
  plan_id: string;
  total_steps: number;
  completed_steps: number;
  successful_steps: number;
  results: TaskPlannerStepResult[];
  cancelled: boolean;
}

export interface PlannerProgress {
  plan_id: string;
  task: string;
  total_steps: number;
  current_step: number;
  current_goal: string;
  status: string;
  results: TaskPlannerStepResult[];
  consecutive_failures: number;
  cancelled: boolean;
  done: boolean;
  error?: string | null;
}

export interface PlannerCheckpoint {
  plan_id: string;
  task: string;
  total_steps: number;
  completed_steps: number;
  updated_at: string;
}

export type ActivityView = 'knowledge' | 'ide' | 'editor' | 'ai' | 'automation' | 'planner' | 'settings' | 'git';
export type SettingsTab = 'general' | 'models' | 'gguf' | 'assistant' | 'orchestration' | 'agents' | 'api-keys' | 'llm-providers' | 'llm-router' | 'mcp-servers' | 'workflows' | 'security' | 'updates';
