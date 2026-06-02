import { useEffect, useState, useRef } from 'react';
import type { LocalPluginManifest } from '../../infrastructure/native';
import type { PluginManifest } from '../../plugins';
import type { SettingsState } from '../../shared/types';
import { createPluginService, type PluginService } from '../../application/services/plugins';

export function usePlugins(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
  const serviceRef = useRef<PluginService | null>(null);
  function getService() {
    if (!serviceRef.current) {
      serviceRef.current = createPluginService(addLog, addAudit);
    }
    return serviceRef.current;
  }

  const [enabledPlugins, setEnabledPlugins] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('jarvis-enabled-plugins');
      return raw ? JSON.parse(raw) as string[] : [];
    } catch {
      return [];
    }
  });
  const [localPlugins, setLocalPlugins] = useState<LocalPluginManifest[]>([]);

  useEffect(() => {
    localStorage.setItem('jarvis-enabled-plugins', JSON.stringify(enabledPlugins));
  }, [enabledPlugins]);

  function togglePlugin(
    plugin: PluginManifest,
    permissions: SettingsState['permissions'],
  ) {
    if (!getService().canTogglePlugin(plugin, permissions as Record<string, boolean>)) {
      return;
    }

    setEnabledPlugins((current) =>
      current.includes(plugin.id)
        ? current.filter((id) => id !== plugin.id)
        : [...current, plugin.id],
    );
    addAudit('Plugin Manager', plugin.permissions.join(', '), plugin.id, 'Estado alterado');
  }

  async function refreshLocalPlugins(path = '') {
    const manifests = await getService().refreshLocalPlugins(path);
    setLocalPlugins(manifests);
  }

  return {
    enabledPlugins, setEnabledPlugins,
    localPlugins, setLocalPlugins,
    togglePlugin,
    refreshLocalPlugins,
  };
}
