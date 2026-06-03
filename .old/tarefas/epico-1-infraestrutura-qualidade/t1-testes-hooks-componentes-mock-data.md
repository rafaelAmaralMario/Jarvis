# Mock Data: Testes de Hooks e Componentes

## Workspace Files Mock

```typescript
export const mockWorkspaceFiles = [
  {
    name: 'src',
    path: '/workspace/src',
    is_dir: true,
    children: [
      {
        name: 'index.ts',
        path: '/workspace/src/index.ts',
        is_dir: false,
        children: null,
      },
      {
        name: 'components',
        path: '/workspace/src/components',
        is_dir: true,
        children: [
          {
            name: 'App.tsx',
            path: '/workspace/src/components/App.tsx',
            is_dir: false,
            children: null,
          },
        ],
      },
    ],
  },
  {
    name: 'package.json',
    path: '/workspace/package.json',
    is_dir: false,
    children: null,
  },
];
```

## Git Status Mock

```typescript
export const mockGitStatus = [
  { x: 'M', y: ' ', path: 'src/index.ts' },
  { x: ' ', y: 'M', path: 'package.json' },
  { x: '?', y: '?', path: 'new-file.ts' },
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
```

## Chat Messages Mock

```typescript
export const mockChatMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Ola, me ajude com este codigo',
    timestamp: Date.now() - 60000,
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'Claro! Como posso ajudar?',
    timestamp: Date.now() - 30000,
    modelId: 'mock-text',
  },
];

export const mockStreamChunks = ['Ola', ', ', 'como', ' posso', ' ajudar', '?'];
```

## Plugins Mock

```typescript
export const mockPlugins = [
  {
    id: 'mock-provider',
    name: 'Mock AI Provider',
    version: '1.0.0',
    capabilities: ['models.text', 'models.code'],
    permissions: [],
    builtIn: true,
    active: true,
  },
  {
    id: 'git-local',
    name: 'Git Local',
    version: '1.0.0',
    capabilities: ['git.status', 'git.diff'],
    permissions: ['git'],
    builtIn: true,
    active: true,
  },
  {
    id: 'obsidian-context',
    name: 'Obsidian Context',
    version: '1.0.0',
    capabilities: ['context.markdown', 'obsidian.vault.read'],
    permissions: ['read-workspace'],
    builtIn: true,
    active: false,
  },
];
```

## Settings Mock

```typescript
export const mockSettings = {
  theme: 'dark' as const,
  activeModelId: 'mock-text',
  ollamaUrl: 'http://localhost:11434',
  openaiUrl: '',
  openaiKey: '',
  generalVaultPath: '',
  projectVaultPath: '',
  permissions: {
    'read-workspace': true,
    'write-workspace': false,
    git: true,
    network: false,
    secrets: false,
  },
};
```

## Audit Events Mock

```typescript
export const mockAuditEvents = [
  {
    id: 'audit-1',
    timestamp: Date.now() - 5000,
    actor: 'agent:developer',
    action: 'read-workspace',
    target: 'src/index.ts',
    result: 'success',
  },
  {
    id: 'audit-2',
    timestamp: Date.now() - 3000,
    actor: 'user',
    action: 'git.commit',
    target: 'workspace',
    result: 'success',
  },
];
```
