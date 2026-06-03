import { pluginManifests } from '../manifests';

describe('Plugin Manifests', () => {
  it('has exactly 3 built-in plugins', () => {
    expect(pluginManifests).toHaveLength(3);
  });

  it('each plugin has required fields', () => {
    for (const plugin of pluginManifests) {
      expect(plugin.id).toBeTruthy();
      expect(plugin.name).toBeTruthy();
      expect(plugin.version).toBeTruthy();
      expect(plugin.capabilities).toBeInstanceOf(Array);
      expect(plugin.capabilities.length).toBeGreaterThan(0);
      expect(plugin.permissions).toBeInstanceOf(Array);
    }
  });

  it('has unique plugin ids', () => {
    const ids = pluginManifests.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mock-provider plugin has no permissions', () => {
    const mock = pluginManifests.find((p) => p.id === 'jarvis.mock-provider')!;
    expect(mock.permissions).toHaveLength(0);
    expect(mock.capabilities).toContain('models.text');
    expect(mock.capabilities).toContain('models.code');
  });

  it('git plugin has git.read permission', () => {
    const git = pluginManifests.find((p) => p.id === 'jarvis.git')!;
    expect(git.permissions).toContain('git.read');
    expect(git.capabilities).toContain('git.status');
    expect(git.capabilities).toContain('git.diff');
  });

  it('obsidian plugin has filesystem.read permission', () => {
    const obsidian = pluginManifests.find((p) => p.id === 'jarvis.obsidian')!;
    expect(obsidian.permissions).toContain('filesystem.read');
    expect(obsidian.capabilities).toContain('context.markdown');
    expect(obsidian.capabilities).toContain('obsidian.vault.read');
  });

  it('all plugins are version 0.1.0', () => {
    for (const plugin of pluginManifests) {
      expect(plugin.version).toBe('0.1.0');
    }
  });
});
