import { modelRegistry } from '../model-registry';

describe('Model Registry', () => {
  it('defaultModelId is mock-text', () => {
    expect(modelRegistry.defaultId).toBe('mock-text');
  });

  it('has 7 built-in models', () => {
    expect(modelRegistry.getAll()).toHaveLength(7);
  });

  it('each model has required fields', () => {
    for (const model of modelRegistry.getAll()) {
      expect(model.id).toBeTruthy();
      expect(model.providerId).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.capabilities.length).toBeGreaterThan(0);
      expect(['active', 'experimental', 'deprecated']).toContain(model.status);
    }
  });

  it('has mock provider models', () => {
    const mockModels = modelRegistry.getAll().filter((m) => m.providerId === 'mock');
    expect(mockModels).toHaveLength(3);
    expect(mockModels.map((m) => m.id)).toEqual(['mock-text', 'mock-image', 'mock-embeddings']);
  });

  it('has ollama provider models', () => {
    const ollamaModels = modelRegistry.getAll().filter((m) => m.providerId === 'ollama');
    expect(ollamaModels).toHaveLength(2);
    expect(ollamaModels.map((m) => m.id)).toEqual(['ollama:llama3.2', 'ollama:qwen2.5-coder']);
  });

  it('has openai-compatible provider models', () => {
    const openaiModels = modelRegistry.getAll().filter((m) => m.providerId === 'openai-compatible');
    expect(openaiModels).toHaveLength(2);
    expect(openaiModels.map((m) => m.id)).toEqual(['openai:gpt-4.1-mini', 'openai:image-model']);
  });

  it('mock-text is the only active model by default', () => {
    const activeModels = modelRegistry.getAll().filter((m) => m.status === 'active');
    expect(activeModels).toHaveLength(1);
    expect(activeModels[0].id).toBe('mock-text');
  });

  it('no duplicate model ids', () => {
    const ids = modelRegistry.getAll().map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('allows registering new models', () => {
    const before = modelRegistry.getAll().length;
    modelRegistry.register({
      id: 'test:custom',
      providerId: 'custom',
      name: 'Custom Test Model',
      capabilities: ['text'],
      status: 'experimental',
    });
    expect(modelRegistry.getAll()).toHaveLength(before + 1);
    expect(modelRegistry.get('test:custom')?.name).toBe('Custom Test Model');
    expect(modelRegistry.byProvider.forProvider('custom')).toHaveLength(1);
  });
});
