import type { SettingsState } from './types';

const settingsKey = 'jarvis.settings.v1';

export function loadSettings(defaultSettings: SettingsState): SettingsState {
  const stored = localStorage.getItem(settingsKey);
  if (!stored) {
    return defaultSettings;
  }
  try {
    const parsed = JSON.parse(stored) as Partial<SettingsState> & { vaultPath?: string };
    return {
      ...defaultSettings,
      ...parsed,
      generalVaultPath: parsed.generalVaultPath ?? (parsed as Record<string, string | undefined>).vaultPath ?? defaultSettings.generalVaultPath,
      projectVaultPath: parsed.projectVaultPath ?? defaultSettings.projectVaultPath,
      contextVaultKind: parsed.contextVaultKind ?? defaultSettings.contextVaultKind,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SettingsState): void {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

import type { ChatMessage, AuditEvent, MemoryEntry } from './types';

export function historyKey(workspacePath: string) {
  return `jarvis.chat.${workspacePath}`;
}

export function loadWorkspaceMessages(workspacePath: string): ChatMessage[] {
  const stored = localStorage.getItem(historyKey(workspacePath));
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWorkspaceMessages(workspacePath: string, messages: ChatMessage[]): void {
  localStorage.setItem(historyKey(workspacePath), JSON.stringify(messages));
}

export function auditKey(workspacePath: string) {
  return `jarvis.audit.${workspacePath}`;
}

export function loadWorkspaceAudit(workspacePath: string): AuditEvent[] {
  const stored = localStorage.getItem(auditKey(workspacePath));
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWorkspaceAudit(workspacePath: string, events: AuditEvent[]): void {
  localStorage.setItem(auditKey(workspacePath), JSON.stringify(events));
}

export function memoryKey(workspacePath: string) {
  return `jarvis.memory.${workspacePath}`;
}

export function loadWorkspaceMemory(workspacePath: string): MemoryEntry[] {
  const stored = localStorage.getItem(memoryKey(workspacePath));
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWorkspaceMemory(workspacePath: string, entries: MemoryEntry[]): void {
  localStorage.setItem(memoryKey(workspacePath), JSON.stringify(entries));
}
