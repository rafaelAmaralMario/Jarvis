import type { AiModel } from '../domain';

export const models: AiModel[] = [
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

export const defaultModelId = 'mock-text';
