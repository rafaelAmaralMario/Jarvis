import type { WorkspaceEntry } from '../infrastructure/native';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ActionLog {
  id: string;
  message: string;
  status: 'ok' | 'warn';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  permission: string;
  target: string;
  result: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  createdAt: string;
}

export interface ContextResult {
  id: string;
  title: string;
  source: string;
  score: number;
  preview: string;
}

export type ContextVaultKind = 'general' | 'project';

export type ModelHealth = 'unknown' | 'ok' | 'fail';

export type PermissionId = 'read-workspace' | 'write-workspace' | 'git' | 'network' | 'secrets';

export type AgentFormState = {
  name: string;
  intent: string;
  permissions: string[];
};

export interface EditorTab {
  path: string;
  name: string;
  content: string;
  savedContent: string;
  language: string;
}

export type ActivityView = 'files' | 'git' | 'search' | 'settings' | 'plugins' | 'context' | 'agents' | 'help';

export type BottomView = 'terminal' | 'logs' | 'diff' | 'proposal' | 'audit';

export interface SettingsState {
  selectedModelId: string;
  providerKind: 'mock' | 'ollama' | 'openai-compatible';
  ollamaBaseUrl: string;
  ollamaModelsPath: string;
  openaiCompatibleBaseUrl: string;
  generalVaultPath: string;
  projectVaultPath: string;
  contextVaultKind: ContextVaultKind;
  workspacePath: string;
  theme: 'dark' | 'light';
  sidebarWidth: number;
  aiPanelWidth: number;
  permissions: Record<PermissionId, boolean>;
}

export type ModalState =
  | { type: 'create-file'; title: string }
  | { type: 'create-folder'; title: string }
  | { type: 'rename'; title: string; entry: WorkspaceEntry }
  | { type: 'move'; title: string; entry: WorkspaceEntry }
  | { type: 'delete'; title: string; entry: WorkspaceEntry }
  | { type: 'switch-workspace'; title: string }
  | null;
