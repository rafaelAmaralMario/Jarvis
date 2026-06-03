import type { AgentDefinition } from '../../agents';
import type { ModelHealth } from '../../shared/types';

interface AgentsPanelProps {
  allAgents: AgentDefinition[];
  modelHealth: ModelHealth;
  onOpenAgentDesigner: () => void;
  onRunAgent: (agentId: string) => void;
}

export function AgentsPanel({
  allAgents,
  modelHealth,
  onOpenAgentDesigner,
  onRunAgent,
}: AgentsPanelProps) {
  return (
    <div className="panel-list">
      <article className="plugin-card">
        <strong>Criar novo agente</strong>
        <p>Disponivel depois que o modelo ativo passar no teste.</p>
        <button
          className="primary-button"
          disabled={modelHealth !== 'ok'}
          onClick={onOpenAgentDesigner}
          type="button"
        >
          Novo agente
        </button>
      </article>
      {allAgents.map((agent) => (
        <article className="plugin-card" key={agent.id}>
          <strong>Agente {agent.name}</strong>
          <p>{agent.goal}</p>
          <small>Permissoes: {agent.permissions.join(', ')}</small>
          <button className="text-button" onClick={() => onRunAgent(agent.id)} type="button">
            Executar
          </button>
        </article>
      ))}
    </div>
  );
}
