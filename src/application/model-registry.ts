import type { AiModel } from '../domain';

const builtInModels: AiModel[] = [
  {
    id: 'mock-text',
    providerId: 'mock',
    name: 'JARVIS Mock Text',
    capabilities: ['text', 'code'],
    status: 'active',
  },
  {
    id: 'mock-image',
    providerId: 'mock',
    name: 'JARVIS Mock Image',
    capabilities: ['image'],
    status: 'experimental',
  },
  {
    id: 'mock-embeddings',
    providerId: 'mock',
    name: 'JARVIS Mock Embeddings',
    capabilities: ['embeddings'],
    status: 'experimental',
  },
  {
    id: 'ollama:llama3.2',
    providerId: 'ollama',
    name: 'Ollama Llama 3.2',
    capabilities: ['text'],
    status: 'experimental',
  },
  {
    id: 'ollama:qwen2.5-coder',
    providerId: 'ollama',
    name: 'Ollama Qwen Coder',
    capabilities: ['text', 'code'],
    status: 'experimental',
  },
  {
    id: 'openai:gpt-4.1-mini',
    providerId: 'openai-compatible',
    name: 'OpenAI-compatible GPT 4.1 Mini',
    capabilities: ['text', 'code'],
    status: 'experimental',
  },
  {
    id: 'openai:image-model',
    providerId: 'openai-compatible',
    name: 'OpenAI-compatible Image Model',
    capabilities: ['image'],
    status: 'experimental',
  },
];

function createModelRegistry(defaultModelId: string) {
  const models = new Map(builtInModels.map((model) => [model.id, model]));
  let defaultId = defaultModelId;

  return {
    register(model: AiModel) {
      models.set(model.id, model);
    },
    getAll(): AiModel[] {
      return Array.from(models.values());
    },
    get(id: string): AiModel | undefined {
      return models.get(id);
    },
    getDefault(): AiModel | undefined {
      return models.get(defaultId);
    },
    get defaultId(): string {
      return defaultId;
    },
    setDefault(id: string) {
      defaultId = id;
    },
    get byProvider() {
      return {
        forProvider(providerId: string): AiModel[] {
          return Array.from(models.values()).filter((m) => m.providerId === providerId);
        },
      };
    },
  };
}

export const modelRegistry = createModelRegistry('mock-text');
