import type { WorkspaceEntry } from '../infrastructure/workspace';

export type AgentFormState = {
  name: string;
  intent: string;
  permissions: string[];
};

export type ActivityView = 'files' | 'git' | 'search' | 'settings' | 'plugins' | 'context' | 'agents' | 'help';

export type BottomView = 'terminal' | 'logs' | 'diff' | 'proposal' | 'audit';

export type ModalState =
  | { type: 'create-file'; title: string }
  | { type: 'create-folder'; title: string }
  | { type: 'rename'; title: string; entry: WorkspaceEntry }
  | { type: 'move'; title: string; entry: WorkspaceEntry }
  | { type: 'delete'; title: string; entry: WorkspaceEntry }
  | { type: 'switch-workspace'; title: string }
  | null;
