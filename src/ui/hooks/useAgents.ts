import { useEffect, useState } from 'react';
import type { AgentDefinition } from '../../agents';
import type { AgentFormState } from '../../shared/types';

export function useAgents(
  workspacePath: string,
  settings: { projectVaultPath: string; selectedModelId: string },
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit: (actor: string, permission: string, target: string, result: string) => void,
) {
  const [customAgents, setCustomAgents] = useState<AgentDefinition[]>(() => {
    try {
      const raw = localStorage.getItem('jarvis-custom-agents');
      return raw ? JSON.parse(raw) as AgentDefinition[] : [];
    } catch {
      return [];
    }
  });
  const [agentForm, setAgentForm] = useState<AgentFormState>({
    name: '',
    intent: '',
    permissions: ['read-workspace'],
  });
  const [agentCreationActive, setAgentCreationActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('jarvis-custom-agents', JSON.stringify(customAgents));
  }, [customAgents]);

  return {
    customAgents, setCustomAgents,
    agentForm, setAgentForm,
    agentCreationActive, setAgentCreationActive,
  };
}
