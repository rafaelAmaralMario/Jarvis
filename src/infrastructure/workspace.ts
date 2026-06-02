import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export interface WorkspaceEntry {
  name: string;
  path: string;
  kind: 'directory' | 'file';
  children: WorkspaceEntry[];
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

export async function selectWorkspaceFolder(): Promise<string | null> {
  return selectFolder('Selecionar pasta do projeto');
}

export async function selectFolder(title: string): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title,
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

export async function validatePath(path: string): Promise<boolean> {
  return invoke<boolean>('validate_path', { path });
}
