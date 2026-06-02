import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export interface WorkspaceEntry {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  children: WorkspaceEntry[];
}

export interface GitFileStatus {
  path: string;
  status: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export interface MarkdownNote {
  path: string;
  title: string;
}

export interface FileContent {
  path: string;
  content: string;
}

export interface SearchResult {
  path: string;
  line: number;
  preview: string;
}

export interface SecureSettings {
  openaiCompatibleApiKey: string;
}

export interface LocalPluginManifest {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  permissions: string[];
  source: string;
  valid: boolean;
  errors: string[];
}

export async function selectWorkspaceFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Selecionar pasta do projeto',
  });

  return typeof selected === 'string' ? selected : null;
}

export async function getDefaultWorkspacePath(): Promise<string> {
  return invoke<string>('default_workspace_path');
}

export async function listWorkspaceEntries(path?: string): Promise<WorkspaceEntry[]> {
  return invoke<WorkspaceEntry[]>('list_workspace_entries', { path });
}

export async function readTextFile(workspacePath: string, filePath: string): Promise<FileContent> {
  return invoke<FileContent>('read_text_file', { workspacePath, filePath });
}

export async function writeTextFile(
  workspacePath: string,
  filePath: string,
  content: string,
): Promise<void> {
  return invoke<void>('write_text_file', { workspacePath, filePath, content });
}

export async function createFile(
  workspacePath: string,
  parentPath: string,
  name: string,
): Promise<void> {
  return invoke<void>('create_file', { workspacePath, parentPath, name });
}

export async function createFolder(
  workspacePath: string,
  parentPath: string,
  name: string,
): Promise<void> {
  return invoke<void>('create_folder', { workspacePath, parentPath, name });
}

export async function deleteEntry(workspacePath: string, entryPath: string): Promise<void> {
  return invoke<void>('delete_entry', { workspacePath, entryPath });
}

export async function renameEntry(
  workspacePath: string,
  entryPath: string,
  name: string,
): Promise<void> {
  return invoke<void>('rename_entry', { workspacePath, entryPath, name });
}

export async function moveEntry(
  workspacePath: string,
  entryPath: string,
  destinationFolder: string,
): Promise<void> {
  return invoke<void>('move_entry', { workspacePath, entryPath, destinationFolder });
}

export async function searchWorkspace(
  workspacePath: string,
  query: string,
): Promise<SearchResult[]> {
  return invoke<SearchResult[]>('search_workspace', { workspacePath, query });
}

export async function loadSecureSettings(): Promise<SecureSettings> {
  return invoke<{ openai_compatible_api_key: string }>('load_secure_settings').then((settings) => ({
    openaiCompatibleApiKey: settings.openai_compatible_api_key,
  }));
}

export async function saveSecureSettings(settings: SecureSettings): Promise<void> {
  return invoke<void>('save_secure_settings', {
    settings: {
      openai_compatible_api_key: settings.openaiCompatibleApiKey,
    },
  });
}

export async function getGitStatus(workspacePath?: string): Promise<GitFileStatus[]> {
  return invoke<GitFileStatus[]>('git_status', { workspacePath });
}

export async function getGitDiff(workspacePath: string | undefined, filePath: string): Promise<string> {
  return invoke<string>('git_diff', { workspacePath, filePath });
}

export async function stageGitFile(workspacePath: string, filePath: string): Promise<void> {
  return invoke<void>('git_stage', { workspacePath, filePath });
}

export async function unstageGitFile(workspacePath: string, filePath: string): Promise<void> {
  return invoke<void>('git_unstage', { workspacePath, filePath });
}

export async function commitGit(workspacePath: string, message: string): Promise<void> {
  return invoke<void>('git_commit', { workspacePath, message });
}

export async function listGitBranches(workspacePath: string): Promise<GitBranch[]> {
  return invoke<GitBranch[]>('git_branches', { workspacePath });
}

export async function checkoutGitBranch(workspacePath: string, branch: string): Promise<void> {
  return invoke<void>('git_checkout_branch', { workspacePath, branch });
}

export async function createGitBranch(workspacePath: string, branch: string): Promise<void> {
  return invoke<void>('git_create_branch', { workspacePath, branch });
}

export async function getGithubPrUrl(workspacePath: string): Promise<string> {
  return invoke<string>('github_pr_url', { workspacePath });
}

export async function listLocalPluginManifests(
  workspacePath: string,
): Promise<LocalPluginManifest[]> {
  return invoke<LocalPluginManifest[]>('list_local_plugin_manifests', { workspacePath });
}

export async function validatePath(path: string): Promise<boolean> {
  return invoke<boolean>('validate_path', { path });
}

export async function listMarkdownNotes(vaultPath: string): Promise<MarkdownNote[]> {
  return invoke<MarkdownNote[]>('list_markdown_notes', { vaultPath });
}
