import type { TextModelProvider } from '../domain';

export const mockTextProvider: TextModelProvider = {
  id: 'mock',
  name: 'Mock Provider',
  async sendMessage(input: string): Promise<string> {
    return [
      'Resposta simulada do JARVIS.',
      '',
      `Mensagem recebida: "${input}"`,
      '',
      'Este provider mockado valida o fluxo de chat sem acoplar a IDE a um modelo real.',
    ].join('\n');
  },
};

