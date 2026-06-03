import type { PluginManifest } from './index';

export const pluginManifests: PluginManifest[] = [
  {
    id: 'jarvis.mock-provider',
    name: 'Mock AI Provider',
    version: '0.1.0',
    capabilities: ['models.text', 'models.code'],
    permissions: [],
  },
  {
    id: 'jarvis.git',
    name: 'Git Local',
    version: '0.1.0',
    capabilities: ['git.status', 'git.diff'],
    permissions: ['git.read'],
  },
  {
    id: 'jarvis.obsidian',
    name: 'Obsidian Context',
    version: '0.1.0',
    capabilities: ['context.markdown', 'obsidian.vault.read'],
    permissions: ['filesystem.read'],
  },
];
