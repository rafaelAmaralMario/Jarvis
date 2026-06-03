import { listLocalPluginManifests } from '../../infrastructure/native';
import { verifyPlugin } from '../../shared/helpers';
import type { PluginManifest } from '../../plugins';

export function createPluginService(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
  async function refreshLocalPlugins(workspacePath?: string) {
    if (!workspacePath) {
      return [];
    }

    try {
      const manifests = await listLocalPluginManifests(workspacePath);
      return manifests;
    } catch {
      return [];
    }
  }

  function canTogglePlugin(
    plugin: PluginManifest,
    permissions: Record<string, boolean>,
  ): boolean {
    const verification = verifyPlugin(plugin, permissions);
    if (!verification.allowed) {
      addLog(verification.reason, 'warn');
      addAudit('Plugin Manager', plugin.permissions.join(', '), plugin.id, 'Ativacao bloqueada');
      return false;
    }
    return true;
  }

  return { refreshLocalPlugins, canTogglePlugin };
}

export type PluginService = ReturnType<typeof createPluginService>;
