import type { ProviderKind } from '../../domain';
import type { ChatMessage } from '../../shared/types';
import { createTextProvider } from '../../infrastructure/model-providers';
import { formatError } from '../../shared/utils';

export interface ChatServiceConfig {
  providerKind: ProviderKind;
  selectedModelId: string;
  baseUrl: string;
  apiKey: string;
}

export function createChatService(config: ChatServiceConfig) {
  const provider = createTextProvider({
    kind: config.providerKind,
    modelId: config.selectedModelId,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
  });

  return {
    get providerName() {
      return provider.name;
    },

    async sendMessage(
      input: string,
      modelId: string,
      signal: AbortSignal,
      onToken?: (token: string) => void,
    ): Promise<{ content: string; canceled: boolean }> {
      try {
        const content = await provider.sendMessage({
          input,
          modelId,
          signal,
          onToken,
        });

        return { content, canceled: false };
      } catch (error) {
        const canceled = error instanceof DOMException && error.name === 'AbortError';
        const message = canceled
          ? 'Geracao cancelada pelo usuario.'
          : `Nao consegui responder com o modelo atual: ${formatError(error)}`;

        return { content: message, canceled };
      }
    },
  };
}

export type ChatService = ReturnType<typeof createChatService>;
