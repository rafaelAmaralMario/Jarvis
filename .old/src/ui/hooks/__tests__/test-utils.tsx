import { vi } from 'vitest';
import type { WorkspaceEntry } from '../../../infrastructure/workspace';
import type { GitFileStatus, GitBranch } from '../../../infrastructure/native';
import type { PluginManifest } from '../../../plugins';
import type { AiModel, ProviderKind } from '../../../domain';
import type { EditorTab, ActionLog, SettingsState, ChatMessage, AuditEvent, MemoryEntry, ContextResult, ModelHealth, PermissionId } from '../../../shared/types';

export const mockWorkspaceFiles: WorkspaceEntry[] = [
  {
    name: 'src',
    path: '/workspace/src',
    kind: 'directory',
    children: [
      { name: 'index.ts', path: '/workspace/src/index.ts', kind: 'file', children: [] },
      {
        name: 'components',
        path: '/workspace/src/components',
        kind: 'directory',
        children: [
          { name: 'App.tsx', path: '/workspace/src/components/App.tsx', kind: 'file', children: [] },
        ],
      },
    ],
  },
  { name: 'package.json', path: '/workspace/package.json', kind: 'file', children: [] },
];

export const mockGitStatus: GitFileStatus[] = [
  { path: 'src/index.ts', status: 'M' },
  { path: 'package.json', status: 'M' },
  { path: 'new-file.ts', status: '?' },
];

export const mockGitDiff = `diff --git a/src/index.ts b/src/index.ts
index abc..def 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
+import { foo } from './bar';
 console.log('hello');
-console.log('world');
+console.log('world!');
`;

export const mockGitBranches: GitBranch[] = [
  { name: 'main', current: true },
  { name: 'feature/test', current: false },
];

export const mockChatMessages: ChatMessage[] = [
  { role: 'user', content: 'Ola, me ajude com este codigo' },
  { role: 'assistant', content: 'Claro! Como posso ajudar?' },
];

export const mockPlugins: PluginManifest[] = [
  {
    id: 'mock-provider', name: 'Mock AI Provider', version: '1.0.0',
    capabilities: ['models.text', 'models.code'], permissions: [],
  },
  {
    id: 'git-local', name: 'Git Local', version: '1.0.0',
    capabilities: ['git.status', 'git.diff'], permissions: ['git'],
  },
  {
    id: 'obsidian-context', name: 'Obsidian Context', version: '1.0.0',
    capabilities: ['context.markdown', 'obsidian.vault.read'], permissions: ['read-workspace'],
  },
];

export const mockSettings: SettingsState = {
  theme: 'dark', selectedModelId: 'mock-text', providerKind: 'mock',
  ollamaBaseUrl: 'http://localhost:11434', ollamaModelsPath: '',
  openaiCompatibleBaseUrl: '', generalVaultPath: '', projectVaultPath: '',
  contextVaultKind: 'project', workspacePath: '', sidebarWidth: 300, aiPanelWidth: 380,
  permissions: { 'read-workspace': true, 'write-workspace': false, git: true, network: false, secrets: false },
};

export const mockAuditEvents: AuditEvent[] = [
  { id: 'audit-1', timestamp: '2024-01-01 10:00:00', actor: 'agent:developer', permission: 'read-workspace', target: 'src/index.ts', result: 'success' },
  { id: 'audit-2', timestamp: '2024-01-01 10:01:00', actor: 'user', permission: 'git.commit', target: 'workspace', result: 'success' },
];

export const mockMemoryEntries: MemoryEntry[] = [
  { id: 'mem-1', content: 'Decisao: usar React 19', createdAt: '2024-01-01 10:00:00' },
];

export const mockSearchResults = [
  { path: '/workspace/src/index.ts', line: 5, preview: 'import { foo }' },
];

export const defaultAddLog = vi.fn() as (message: string, status?: ActionLog['status']) => void;
export const defaultAddAudit = vi.fn() as (actor: string, permission: string, target: string, result: string) => void;

export function makeMockEditorTab(overrides: Partial<EditorTab> = {}): EditorTab {
  return {
    path: '/workspace/src/test.ts', name: 'test.ts',
    content: 'const x = 1;', savedContent: 'const x = 1;',
    language: 'typescript', ...overrides,
  };
}
