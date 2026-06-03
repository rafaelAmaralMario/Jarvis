import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { ProviderKind } from '../../domain';
import type { AgentDefinition } from '../../agents';
import type { AgentFormState } from '../types';
import type { EditorTab, PermissionId } from '../../shared/types';
import { createAgentService, type AgentServiceConfig, type AgentService } from '../../application/services/agent';
import type { WorkspaceEntry } from '../../infrastructure/workspace';
import { writeMarkdownNote } from '../../infrastructure/note';
import { formatError, shortPath } from '../../shared/utils';

export interface UseAgentsInput {
  workspacePath: string;
  settings: {
    providerKind: ProviderKind;
    selectedModelId: string;
    ollamaBaseUrl: string;
    openaiCompatibleBaseUrl: string;
    permissions: Record<string, boolean>;
    projectVaultPath: string;
  };
  secureApiKey: string;
  modelHealth: string;
  addLog: (message: string, status?: 'ok' | 'warn') => void;
  addAudit: (actor: string, permission: string, target: string, result: string) => void;
}

export function useAgents(input: UseAgentsInput) {
  const serviceRef = useRef<AgentService | null>(null);
  function getService() {
    if (!serviceRef.current) {
      serviceRef.current = createAgentService({
        providerKind: input.settings.providerKind,
        selectedModelId: input.settings.selectedModelId,
        ollamaBaseUrl: input.settings.ollamaBaseUrl,
        openaiCompatibleBaseUrl: input.settings.openaiCompatibleBaseUrl,
        apiKey: input.secureApiKey,
        projectVaultPath: input.settings.projectVaultPath,
      });
    }
    return serviceRef.current;
  }

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

  function hasAgentPermissions(permissions: string[]) {
    return permissions.every((permission) => input.settings.permissions[permission as PermissionId]);
  }

  async function runBrainAgent(
    agent: AgentDefinition,
    workspacePath: string,
    files: { renderWorkspaceTree: (entries: WorkspaceEntry[]) => string; rawFiles: WorkspaceEntry[] },
    gitFiles: { status: string; path: string }[],
  ) {
    if (!input.settings.projectVaultPath.trim()) {
      input.addLog('Informe o vault especifico do projeto antes de gerar o cerebro.', 'warn');
      return;
    }

    if (input.modelHealth !== 'ok') {
      input.addLog('Teste o modelo com sucesso antes de executar o agente de contexto.', 'warn');
      return;
    }

    try {
      const filesTree = files.renderWorkspaceTree(files.rawFiles);
      const gitChanges = gitFiles.map((f) => `- ${f.status} ${f.path}`).join('\n');
      const result = await getService().runBrainAgent({
        workspacePath,
        modelId: input.settings.selectedModelId,
        filesTree,
        gitChanges: gitChanges || '- Nenhuma mudanca Git detectada.',
      });
      const title = `JARVIS Cerebro ${shortPath(workspacePath)} ${new Date().toISOString().slice(0, 10)}`;
      const notePath = await writeMarkdownNote(input.settings.projectVaultPath, title, result.content);
      input.addLog(`Cerebro do projeto criado: ${notePath}`, 'ok');
      input.addAudit(agent.name, 'read-workspace', input.settings.projectVaultPath, 'Contexto enviado ao Obsidian');
    } catch (error) {
      input.addLog(`Agente de contexto falhou: ${formatError(error)}`, 'warn');
    }
  }

  async function createCustomAgent(
    agentDesignerPath: string,
    welcomeTabPath: string,
    setTabs: Dispatch<SetStateAction<EditorTab[]>>,
    setActiveTabPath: (path: string) => void,
  ) {
    if (input.modelHealth !== 'ok' || agentCreationActive) {
      return;
    }

    if (!agentForm.name.trim() || !agentForm.intent.trim()) {
      input.addLog('Informe nome e objetivo do agente.', 'warn');
      return;
    }

    setAgentCreationActive(true);
    try {
      const result = await getService().createAgentFromPrompt({
        name: agentForm.name.trim(),
        intent: agentForm.intent.trim(),
        modelId: input.settings.selectedModelId,
      });
      const agent: AgentDefinition = {
        id: `custom-${crypto.randomUUID()}`,
        name: agentForm.name.trim(),
        goal: result.content.trim() || agentForm.intent.trim(),
        defaultModelCapability: 'text',
        permissions: agentForm.permissions,
        output: 'docs',
      };
      setCustomAgents((current) => [agent, ...current]);
      setAgentForm({ name: '', intent: '', permissions: ['read-workspace'] });
      setTabs((current) => current.filter((tab) => tab.path !== agentDesignerPath));
      setActiveTabPath(welcomeTabPath);
      input.addLog(`Agente criado: ${agent.name}`, 'ok');
    } catch (error) {
      input.addLog(`Nao foi possivel criar agente: ${formatError(error)}`, 'warn');
    } finally {
      setAgentCreationActive(false);
    }
  }

  return {
    customAgents, setCustomAgents,
    agentForm, setAgentForm,
    agentCreationActive, setAgentCreationActive,
    hasAgentPermissions,
    runBrainAgent,
    createCustomAgent,
  };
}
