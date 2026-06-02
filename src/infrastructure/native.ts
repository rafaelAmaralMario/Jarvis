import { invoke } from '@tauri-apps/api/core';

export interface WorkspaceEntry {
  name: string;
  path: string;
  kind: 'directory' | 'file';
}

export interface GitFileStatus {
  path: string;
  status: string;
}

export interface MarkdownNote {
  path: string;
  title: string;
}

export async function getDefaultWorkspacePath(): Promise<string> {
  return invoke<string>('default_workspace_path');
}

export async function listWorkspaceEntries(path?: string): Promise<WorkspaceEntry[]> {
  return invoke<WorkspaceEntry[]>('list_workspace_entries', { path });
}

export async function getGitStatus(workspacePath?: string): Promise<GitFileStatus[]> {
  return invoke<GitFileStatus[]>('git_status', { workspacePath });
}

export async function getGitDiff(workspacePath: string | undefined, filePath: string): Promise<string> {
  return invoke<string>('git_diff', { workspacePath, filePath });
}

export async function validatePath(path: string): Promise<boolean> {
  return invoke<boolean>('validate_path', { path });
}

export async function listMarkdownNotes(vaultPath: string): Promise<MarkdownNote[]> {
  return invoke<MarkdownNote[]>('list_markdown_notes', { vaultPath });
}

