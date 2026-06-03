import type { TextModelProvider, TextProviderRequest } from '../../domain';
import { delay } from './utils';

export const mockTextProvider: TextModelProvider = {
  id: 'mock',
  name: 'Mock Provider',
  async sendMessage({ input, onToken, signal }: TextProviderRequest): Promise<string> {
    const chunks = [
      'Resposta simulada do JARVIS.',
      '\n\n',
      `Mensagem recebida: "${input}"`,
      '\n\n',
      'Este provider mockado valida o fluxo de chat sem acoplar a IDE a um modelo real.',
    ];

    let response = '';
    for (const chunk of chunks) {
      if (signal?.aborted) {
        throw new DOMException('Generation canceled', 'AbortError');
      }

      await delay(90);
      response += chunk;
      onToken?.(chunk);
    }

    return response;
  },
};
