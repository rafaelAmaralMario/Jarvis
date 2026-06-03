import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import { defaultAddLog } from './test-utils';

const mockSendMessage = vi.fn();

vi.mock('../../../application/services/chat', () => ({
  createChatService: () => ({
    sendMessage: mockSendMessage,
    providerName: 'Mock Provider',
  }),
}));

const baseSettings = {
  providerKind: 'mock' as const,
  selectedModelId: 'mock-text',
  openaiCompatibleBaseUrl: '',
  ollamaBaseUrl: 'http://localhost:11434',
};

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChat(baseSettings, '', defaultAddLog));
    expect(result.current.messages).toEqual([]);
    expect(result.current.generationActive).toBe(false);
  });

  it('should send message and add user + assistant messages', async () => {
    mockSendMessage.mockResolvedValue({ canceled: false });
    const { result } = renderHook(() => useChat(baseSettings, '', defaultAddLog));
    await act(async () => {
      await result.current.sendMessage('hello');
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('hello');
    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('should not send empty or whitespace-only messages', async () => {
    const { result } = renderHook(() => useChat(baseSettings, '', defaultAddLog));
    await act(async () => {
      await result.current.sendMessage('');
    });
    expect(result.current.messages).toHaveLength(0);
    await act(async () => {
      await result.current.sendMessage('   ');
    });
    expect(result.current.messages).toHaveLength(0);
  });

  it('should cancel generation', async () => {
    mockSendMessage.mockResolvedValue({ canceled: true });
    const { result } = renderHook(() => useChat(baseSettings, '', defaultAddLog));
    await act(async () => {
      await result.current.sendMessage('hello');
    });
    expect(result.current.generationActive).toBe(false);
  });

  it('should call cancelGeneration via abort', () => {
    const { result } = renderHook(() => useChat(baseSettings, '', defaultAddLog));
    act(() => { result.current.cancelGeneration(); });
    expect(result.current.generationActive).toBe(false);
  });

  it('should update chatInput state', () => {
    const { result } = renderHook(() => useChat(baseSettings, '', defaultAddLog));
    act(() => { result.current.setChatInput('new message'); });
    expect(result.current.chatInput).toBe('new message');
  });
});
