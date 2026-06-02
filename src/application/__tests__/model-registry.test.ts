import { defaultModelId, models } from '../model-registry';

describe('Model Registry', () => {
  it('defaultModelId is mock-text', () => {
    expect(defaultModelId).toBe('mock-text');
  });

  it('has 7 built-in models', () => {
    expect(models).toHaveLength(7);
  });

  it('each model has required fields', () => {
    for (const model of models) {
      expect(model.id).toBeTruthy();
      expect(model.providerId).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.capabilities.length).toBeGreaterThan(0);
      expect(['active', 'experimental', 'deprecated']).toContain(model.status);
    }
  });

  it('has mock provider models', () => {
    const mockModels = models.filter((m) => m.providerId === 'mock');
    expect(mockModels).toHaveLength(3);
    expect(mockModels.map((m) => m.id)).toEqual(['mock-text', 'mock-image', 'mock-embeddings']);
  });

  it('has ollama provider models', () => {
    const ollamaModels = models.filter((m) => m.providerId === 'ollama');
    expect(ollamaModels).toHaveLength(2);
    expect(ollamaModels.map((m) => m.id)).toEqual(['ollama:llama3.2', 'ollama:qwen2.5-coder']);
  });

  it('has openai-compatible provider models', () => {
    const openaiModels = models.filter((m) => m.providerId === 'openai-compatible');
    expect(openaiModels).toHaveLength(2);
    expect(openaiModels.map((m) => m.id)).toEqual(['openai:gpt-4.1-mini', 'openai:image-model']);
  });

  it('mock-text is the only active model by default', () => {
    const activeModels = models.filter((m) => m.status === 'active');
    expect(activeModels).toHaveLength(1);
    expect(activeModels[0].id).toBe('mock-text');
  });

  it('no duplicate model ids', () => {
    const ids = models.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
