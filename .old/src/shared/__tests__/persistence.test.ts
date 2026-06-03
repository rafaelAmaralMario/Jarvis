import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadWorkspaceMessages,
  saveWorkspaceMessages,
  loadWorkspaceAudit,
  saveWorkspaceAudit,
  loadWorkspaceMemory,
  saveWorkspaceMemory,
} from '../persistence';
import type { SettingsState, ChatMessage, AuditEvent, MemoryEntry } from '../types';

function defaultSettings(): SettingsState {
  return {
    selectedModelId: 'mock-text',
    providerKind: 'mock',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModelsPath: '',
    openaiCompatibleBaseUrl: '',
    generalVaultPath: '',
    projectVaultPath: '',
    contextVaultKind: 'general',
    workspacePath: '',
    theme: 'dark',
    sidebarWidth: 300,
    aiPanelWidth: 380,
    permissions: {
      'read-workspace': true,
      'write-workspace': false,
      git: false,
      network: false,
      secrets: false,
    },
  };
}

describe('Settings persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadSettings returns defaults when nothing stored', () => {
    const defaults = defaultSettings();
    const loaded = loadSettings(defaults);
    expect(loaded.selectedModelId).toBe('mock-text');
    expect(loaded.theme).toBe('dark');
  });

  it('saveSettings and loadSettings round-trips', () => {
    const defaults = defaultSettings();
    const modified = { ...defaults, theme: 'light' as const, selectedModelId: 'gpt-4' };
    saveSettings(modified);
    const loaded = loadSettings(defaults);
    expect(loaded.theme).toBe('light');
    expect(loaded.selectedModelId).toBe('gpt-4');
  });

  it('loadSettings merges with defaults for missing keys', () => {
    saveSettings({ selectedModelId: 'custom-model' } as SettingsState);
    const defaults = defaultSettings();
    const loaded = loadSettings(defaults);
    expect(loaded.selectedModelId).toBe('custom-model');
    expect(loaded.theme).toBe('dark');
  });
});

describe('Workspace messages persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadWorkspaceMessages returns empty array when nothing stored', () => {
    const messages = loadWorkspaceMessages('/nonexistent');
    expect(messages).toEqual([]);
  });

  it('saveWorkspaceMessages and loadWorkspaceMessages round-trips', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ];
    saveWorkspaceMessages('/test', messages);
    const loaded = loadWorkspaceMessages('/test');
    expect(loaded).toHaveLength(2);
    expect(loaded[0].content).toBe('hello');
    expect(loaded[1].role).toBe('assistant');
  });

  it('messages are isolated per workspace path', () => {
    saveWorkspaceMessages('/a', [{ role: 'user', content: 'from a' }]);
    saveWorkspaceMessages('/b', [{ role: 'user', content: 'from b' }]);
    expect(loadWorkspaceMessages('/a')[0].content).toBe('from a');
    expect(loadWorkspaceMessages('/b')[0].content).toBe('from b');
  });
});

describe('Audit persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadWorkspaceAudit returns empty array when nothing stored', () => {
    expect(loadWorkspaceAudit('/test')).toEqual([]);
  });

  it('saveWorkspaceAudit and loadWorkspaceAudit round-trips', () => {
    const events: AuditEvent[] = [
      { id: '1', timestamp: new Date().toISOString(), actor: 'user', permission: 'git', target: '/file', result: 'ok' },
    ];
    saveWorkspaceAudit('/test', events);
    expect(loadWorkspaceAudit('/test')).toHaveLength(1);
  });
});

describe('Memory persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadWorkspaceMemory returns empty array when nothing stored', () => {
    expect(loadWorkspaceMemory('/test')).toEqual([]);
  });

  it('saveWorkspaceMemory and loadWorkspaceMemory round-trips', () => {
    const entries: MemoryEntry[] = [
      { id: '1', content: 'remember this', createdAt: new Date().toISOString() },
    ];
    saveWorkspaceMemory('/test', entries);
    expect(loadWorkspaceMemory('/test')).toHaveLength(1);
    expect(loadWorkspaceMemory('/test')[0].content).toBe('remember this');
  });
});
