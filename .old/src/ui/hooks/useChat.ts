import { useRef, useState } from 'react';
import type { ChatMessage } from '../../shared/types';
import type { ProviderKind } from '../../domain';
import { createChatService } from '../../application/services/chat';
import type { ChatServiceConfig } from '../../application/services/chat';

export function useChat(
  settings: { providerKind: ProviderKind; selectedModelId: string; openaiCompatibleBaseUrl: string; ollamaBaseUrl: string },
  secureApiKey: string,
  addLog: (message: string, status?: 'ok' | 'warn') => void,
) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generationActive, setGenerationActive] = useState(false);
  const [chatHydratedWorkspace, setChatHydratedWorkspace] = useState('');
  const serviceRef = useRef<ReturnType<typeof createChatService> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);

  function getService() {
    if (!serviceRef.current) {
      const baseUrl =
        settings.providerKind === 'ollama'
          ? settings.ollamaBaseUrl
          : settings.openaiCompatibleBaseUrl;

      const config: ChatServiceConfig = {
        providerKind: settings.providerKind,
        selectedModelId: settings.selectedModelId,
        baseUrl,
        apiKey: secureApiKey,
      };

      serviceRef.current = createChatService(config);
    }
    return serviceRef.current;
  }

  async function sendMessage(input: string) {
    if (!input.trim() || generationActive) return;

    setChatInput('');
    setMessages((current) => [
      ...current,
      { role: 'user', content: input },
      { role: 'assistant', content: '' },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    setGenerationActive(true);

    const service = getService();

    const { canceled } = await service.sendMessage(
      input,
      settings.selectedModelId,
      controller.signal,
      (token) => {
        setMessages((current) =>
          current.map((message, index) =>
            index === current.length - 1
              ? { ...message, content: `${message.content}${token}` }
              : message,
          ),
        );
      },
    );

    abortRef.current = null;
    setGenerationActive(false);

    if (canceled) {
      setMessages((current) =>
        current.map((item, index) =>
          index === current.length - 1 && item.role === 'assistant' && item.content.trim() === ''
            ? { ...item, content: 'Geracao cancelada pelo usuario.' }
            : item,
        ),
      );
      addLog('Geracao cancelada pelo usuario.', 'ok');
    } else {
      addLog(`Chat respondido por ${service.providerName}`, 'ok');
    }
  }

  function cancelGeneration() {
    abortRef.current?.abort();
  }

  return {
    chatInput, setChatInput,
    messages, setMessages,
    generationActive,
    chatHydratedWorkspace, setChatHydratedWorkspace,
    chatMessagesRef,
    sendMessage,
    cancelGeneration,
  };
}
