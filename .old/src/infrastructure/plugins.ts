import { invoke } from '@tauri-apps/api/core';

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

export async function listLocalPluginManifests(
  workspacePath: string,
): Promise<LocalPluginManifest[]> {
  return invoke<LocalPluginManifest[]>('list_local_plugin_manifests', { workspacePath });
}
