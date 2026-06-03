import { createTextProvider } from '../../infrastructure/model-providers';
import type { ProviderKind } from '../../domain';

export interface AgentServiceConfig {
  providerKind: ProviderKind;
  selectedModelId: string;
  ollamaBaseUrl: string;
  openaiCompatibleBaseUrl: string;
  apiKey?: string;
  projectVaultPath: string;
}

export interface BrainAgentInput {
  workspacePath: string;
  modelId: string;
  filesTree: string;
  gitChanges: string;
}

export interface AgentCreationInput {
  name: string;
  intent: string;
  modelId: string;
}

export interface AgentResult {
  content: string;
}

export interface AgentCreationResult {
  content: string;
}

export function createAgentService(config: AgentServiceConfig) {
  function getProvider() {
    return createTextProvider({
      kind: config.providerKind,
      modelId: config.selectedModelId,
      baseUrl: config.providerKind === 'ollama' ? config.ollamaBaseUrl : config.openaiCompatibleBaseUrl,
      apiKey: config.apiKey,
    });
  }

  async function runBrainAgent(input: BrainAgentInput): Promise<AgentResult> {
    const provider = getProvider();
    const prompt = [
      'Voce e um agente de arquitetura. Analise este projeto e gere uma nota Markdown para um vault Obsidian.',
      'Separe em secoes: visao geral, arquitetura, funcionalidades, agentes, modelos, integracoes, riscos e proximos passos.',
      'Use bullets objetivos e inclua caminhos importantes quando fizer sentido.',
      '',
      `Workspace: ${input.workspacePath}`,
      `Modelo: ${input.modelId}`,
      '',
      'Arvore de arquivos:',
      input.filesTree,
      '',
      'Mudancas Git:',
      input.gitChanges || '- Nenhuma mudanca Git detectada.',
    ].join('\n');

    const content = await provider.sendMessage({
      input: prompt,
      modelId: input.modelId,
    });

    return { content };
  }

  async function createAgentFromPrompt(input: AgentCreationInput): Promise<AgentCreationResult> {
    const provider = getProvider();
    const response = await provider.sendMessage({
      input: [
        'Transforme a ideia abaixo em uma definicao curta de agente para uma IDE com IA.',
        'Responda em portugues com uma frase de objetivo clara e objetiva.',
        `Nome: ${input.name}`,
        `Intencao: ${input.intent}`,
      ].join('\n'),
      modelId: input.modelId,
    });

    return { content: response };
  }

  return { runBrainAgent, createAgentFromPrompt };
}

export type AgentService = ReturnType<typeof createAgentService>;
