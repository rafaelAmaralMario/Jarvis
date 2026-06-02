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
];

export const defaultModelId = 'mock-text';

