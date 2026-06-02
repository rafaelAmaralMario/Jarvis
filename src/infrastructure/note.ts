import { invoke } from '@tauri-apps/api/core';

export interface MarkdownNote {
  path: string;
  title: string;
  content: string;
}

export async function listMarkdownNotes(vaultPath: string): Promise<MarkdownNote[]> {
  return invoke<MarkdownNote[]>('list_markdown_notes', { vaultPath });
}

export async function writeMarkdownNote(
  vaultPath: string,
  title: string,
  content: string,
): Promise<string> {
  return invoke<string>('write_markdown_note', { vaultPath, title, content });
}
