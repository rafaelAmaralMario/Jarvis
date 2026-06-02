import { useEffect, useState } from 'react';
import type { LocalPluginManifest } from '../../infrastructure/native';
import { listLocalPluginManifests } from '../../infrastructure/native';
import type { PluginManifest } from '../../plugins';
import { verifyPlugin } from '../../shared/helpers';
import type { PermissionId, SettingsState } from '../../shared/types';

export function usePlugins(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
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
    const verification = verifyPlugin(plugin, permissions);
    if (!verification.allowed) {
      addLog(verification.reason, 'warn');
      addAudit('Plugin Manager', plugin.permissions.join(', '), plugin.id, 'Ativacao bloqueada');
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
    try {
      setLocalPlugins(await listLocalPluginManifests(path));
    } catch {
      setLocalPlugins([]);
    }
  }

  return {
    enabledPlugins, setEnabledPlugins,
    localPlugins, setLocalPlugins,
    togglePlugin,
    refreshLocalPlugins,
  };
}
