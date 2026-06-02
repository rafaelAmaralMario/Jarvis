import { useRef, useState } from 'react';
import type { ChatMessage } from '../../shared/types';
import type { ProviderKind, AiModel } from '../../domain';
import { createTextProvider } from '../../infrastructure/model-providers';
import { formatError } from '../../shared/utils';

export function useChat(
  settings: { providerKind: ProviderKind; selectedModelId: string; openaiCompatibleBaseUrl: string; ollamaBaseUrl: string },
  secureApiKey: string,
  addLog: (message: string, status?: 'ok' | 'warn') => void,
) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generationActive, setGenerationActive] = useState(false);
  const [chatHydratedWorkspace, setChatHydratedWorkspace] = useState('');
  const generationController = useRef<AbortController | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);

  function createCurrentTextProvider() {
    return createTextProvider({
      kind: settings.providerKind,
      modelId: settings.selectedModelId,
      baseUrl:
        settings.providerKind === 'ollama'
          ? settings.ollamaBaseUrl
          : settings.openaiCompatibleBaseUrl,
      apiKey: secureApiKey,
    });
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
    generationController.current = controller;
    setGenerationActive(true);

    const provider = createCurrentTextProvider();

    try {
      await provider.sendMessage({
        input,
        modelId: settings.selectedModelId,
        signal: controller.signal,
        onToken(token) {
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1
                ? { ...message, content: `${message.content}${token}` }
                : message,
            ),
          );
        },
      });
      addLog(`Chat respondido por ${provider.name}`, 'ok');
    } catch (error) {
      const canceled = error instanceof DOMException && error.name === 'AbortError';
      const message = canceled
        ? 'Geracao cancelada pelo usuario.'
        : `Nao consegui responder com o modelo atual: ${formatError(error)}`;
      setMessages((current) =>
        current.map((item, index) =>
          index === current.length - 1 && item.role === 'assistant' && item.content.trim() === ''
            ? { ...item, content: message }
            : item,
        ),
      );
      addLog(message, canceled ? 'ok' : 'warn');
    } finally {
      generationController.current = null;
      setGenerationActive(false);
    }
  }

  function cancelGeneration() {
    generationController.current?.abort();
  }

  return {
    chatInput, setChatInput,
    messages, setMessages,
    generationActive,
    chatHydratedWorkspace, setChatHydratedWorkspace,
    generationController,
    chatMessagesRef,
    createCurrentTextProvider,
    sendMessage,
    cancelGeneration,
  };
}
