import { mockTextProvider } from '../model-providers';

describe('Mock Text Provider', () => {
  it('has correct id and name', () => {
    expect(mockTextProvider.id).toBe('mock');
    expect(mockTextProvider.name).toBe('Mock Provider');
  });

  it('returns a response with the input message', async () => {
    const response = await mockTextProvider.sendMessage({
      input: 'test message',
      modelId: 'mock-text',
    });

    expect(response).toContain('test message');
    expect(response).toContain('Resposta simulada');
  });

  it('respects abort signal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      mockTextProvider.sendMessage({
        input: 'test',
        modelId: 'mock-text',
        signal: controller.signal,
      }),
    ).rejects.toThrow('Generation canceled');
  });

  it('calls onToken for each chunk', async () => {
    const onToken = vi.fn();
    await mockTextProvider.sendMessage({
      input: 'hello',
      modelId: 'mock-text',
      onToken,
    });

    expect(onToken).toHaveBeenCalled();
    expect(onToken.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('returns the full concatenated response', async () => {
    const response = await mockTextProvider.sendMessage({
      input: 'hello',
      modelId: 'mock-text',
    });

    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });
});
