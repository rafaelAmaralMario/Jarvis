import type { AiModel, ProviderSettings, TextModelProvider, TextProviderRequest } from '../models';

describe('Domain Models', () => {
  it('AiModel type has required fields', () => {
    const model: AiModel = {
      id: 'test',
      providerId: 'mock',
      name: 'Test Model',
      capabilities: ['text'],
      status: 'active',
    };
    expect(model.id).toBe('test');
    expect(model.providerId).toBe('mock');
    expect(model.name).toBe('Test Model');
    expect(model.capabilities).toContain('text');
    expect(model.status).toBe('active');
  });

  it('AiModel supports all capability types', () => {
    const capabilities: AiModel['capabilities'] = ['text', 'code', 'image', 'embeddings'];
    expect(capabilities).toHaveLength(4);
  });

  it('AiModel supports all status types', () => {
    const statuses: AiModel['status'][] = ['active', 'experimental', 'deprecated'];
    expect(statuses).toHaveLength(3);
  });

  it('TextModelProvider interface is properly structured', () => {
    const provider: TextModelProvider = {
      id: 'test-provider',
      name: 'Test',
      async sendMessage(_request: TextProviderRequest): Promise<string> {
        return 'response';
      },
    };
    expect(provider.id).toBe('test-provider');
    expect(provider.name).toBe('Test');
    expect(typeof provider.sendMessage).toBe('function');
  });

  it('TextProviderRequest supports all fields', () => {
    const request: TextProviderRequest = {
      input: 'hello',
      modelId: 'test-model',
      signal: new AbortController().signal,
      onToken: vi.fn(),
    };
    expect(request.input).toBe('hello');
    expect(request.modelId).toBe('test-model');
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(typeof request.onToken).toBe('function');
  });

  it('ProviderSettings supports all provider kinds', () => {
    const mock: ProviderSettings = { kind: 'mock', modelId: 'm1', baseUrl: '' };
    const ollama: ProviderSettings = { kind: 'ollama', modelId: 'o1', baseUrl: 'http://localhost:11434' };
    const openai: ProviderSettings = { kind: 'openai-compatible', modelId: 'gpt-4', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-xxx' };

    expect(mock.kind).toBe('mock');
    expect(ollama.kind).toBe('ollama');
    expect(openai.kind).toBe('openai-compatible');
    expect(openai.apiKey).toBe('sk-xxx');
  });
});
