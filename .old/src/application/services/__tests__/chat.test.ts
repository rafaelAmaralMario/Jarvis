import { describe, it, expect, vi } from 'vitest';
import { createChatService, type ChatServiceConfig } from '../chat';

function makeConfig(overrides: Partial<ChatServiceConfig> = {}): ChatServiceConfig {
  return {
    providerKind: 'mock',
    modelId: 'mock-text',
    baseUrl: '',
    apiKey: '',
    ...overrides,
  };
}

describe('ChatService', () => {
  const modelId = 'mock-text';
  const signal = new AbortController().signal;

  it('creates a service with mock config', () => {
    const service = createChatService(makeConfig());
    expect(service).toBeDefined();
    expect(service.sendMessage).toBeInstanceOf(Function);
  });

  it('sendMessage returns content for mock provider', async () => {
    const service = createChatService(makeConfig());
    const { content, canceled } = await service.sendMessage('hello', modelId, signal);
    expect(canceled).toBe(false);
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
  });

  it('sendMessage returns content containing the input', async () => {
    const service = createChatService(makeConfig());
    const { content } = await service.sendMessage('test message', modelId, signal);
    expect(content).toContain('test message');
  });

  it('sendMessage calls onToken callback', async () => {
    const service = createChatService(makeConfig());
    const onToken = vi.fn();
    const { content } = await service.sendMessage('hello', modelId, signal, onToken);
    expect(onToken).toHaveBeenCalled();
    expect(content).toBe(onToken.mock.calls.join(''));
  });

  it('sendMessage returns canceled true when signal is aborted', async () => {
    const service = createChatService(makeConfig());
    const controller = new AbortController();
    controller.abort();
    const { content, canceled } = await service.sendMessage('test', modelId, controller.signal);
    expect(canceled).toBe(true);
    expect(content).toContain('cancelada');
  });
});
