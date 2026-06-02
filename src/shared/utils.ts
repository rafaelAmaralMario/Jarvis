export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizePath(value: string) {
  return value
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

export function samePath(left: string, right: string) {
  return normalizePath(left) === normalizePath(right);
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function shortPath(path: string) {
  return path.split(/[\\/]/).pop() || path;
}

export function directoryPath(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index > 0 ? path.slice(0, index) : path;
}

export function languageFromPath(path: string) {
  const extension = path.split('.').pop()?.toLowerCase();
  const languageByExtension: Record<string, string> = {
    css: 'css',
    html: 'html',
    js: 'javascript',
    json: 'json',
    md: 'markdown',
    rs: 'rust',
    ts: 'typescript',
    tsx: 'typescript',
  };
  return extension ? (languageByExtension[extension] ?? 'plaintext') : 'plaintext';
}

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

export function boundPanelWidths(sidebarWidth: number, aiPanelWidth: number, viewportWidth: number) {
  const sidebarMinWidth = 260;
  const aiPanelMinWidth = 360;
  const activityBarWidth = 52;
  const combinedResizerWidth = 8;
  const editorMinWidth = 520;
  const available = Math.max(
    sidebarMinWidth + aiPanelMinWidth,
    viewportWidth - activityBarWidth - combinedResizerWidth - editorMinWidth,
  );
  const sidebar = clamp(sidebarWidth, sidebarMinWidth, Math.max(sidebarMinWidth, available - aiPanelMinWidth));
  const ai = clamp(aiPanelWidth, aiPanelMinWidth, Math.max(aiPanelMinWidth, available - sidebar));
  return { sidebar, ai };
}

import type { EditorTab } from './types';

export function tabToEntry(tab: EditorTab) {
  return { name: tab.name, path: `tab:${tab.path}`, kind: 'file' as const, children: [] as never[] };
}
