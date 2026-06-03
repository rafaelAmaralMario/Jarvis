import type { PluginManifest } from '../../plugins';

interface PluginsPanelProps {
  visiblePlugins: Array<PluginManifest & { valid?: boolean; source?: string; errors?: string[] }>;
  enabledPlugins: string[];
  onRefreshLocalPlugins: () => void;
  onTogglePlugin: (plugin: PluginManifest) => void;
}

export function PluginsPanel({
  visiblePlugins,
  enabledPlugins,
  onRefreshLocalPlugins,
  onTogglePlugin,
}: PluginsPanelProps) {
  return (
    <div className="panel-list">
      <button className="text-button" onClick={onRefreshLocalPlugins} type="button">
        Recarregar manifestos locais
      </button>
      {visiblePlugins.map((plugin) => (
        <article className="plugin-card" key={plugin.id}>
          <div>
            <strong>{plugin.name}</strong>
            <span>{enabledPlugins.includes(plugin.id) ? 'Ativo' : plugin.version}</span>
          </div>
          <p>{plugin.capabilities.join(', ')}</p>
          <small>Permissoes: {plugin.permissions.join(', ') || 'nenhuma'}</small>
          {plugin.source && <small>Origem: {plugin.source}</small>}
          {!plugin.valid && <small>Erros: {plugin.errors?.join(', ')}</small>}
          <button className="text-button" onClick={() => onTogglePlugin(plugin)} type="button">
            {enabledPlugins.includes(plugin.id) ? 'Desativar' : 'Ativar'}
          </button>
        </article>
      ))}
    </div>
  );
}
