import type { ProviderSettings, TextModelProvider, TextProviderRequest } from '../domain';

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

export function createTextProvider(settings: ProviderSettings): TextModelProvider {
  if (settings.kind === 'ollama') {
    return new OllamaTextProvider(settings.baseUrl);
  }

  if (settings.kind === 'openai-compatible') {
    return new OpenAICompatibleTextProvider(settings.baseUrl, settings.apiKey ?? '');
  }

  return mockTextProvider;
}

class OllamaTextProvider implements TextModelProvider {
  id = 'ollama';
  name = 'Ollama Local';

  constructor(private readonly baseUrl: string) {}

  async sendMessage({ input, modelId, signal, onToken }: TextProviderRequest): Promise<string> {
    const response = await fetch(`${trimUrl(this.baseUrl)}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId.replace('ollama:', ''),
        prompt: input,
        stream: true,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama respondeu com status ${response.status}`);
    }

    return readJsonLines(response, 'response', onToken);
  }
}

class OpenAICompatibleTextProvider implements TextModelProvider {
  id = 'openai-compatible';
  name = 'OpenAI-compatible';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async sendMessage({ input, modelId, signal, onToken }: TextProviderRequest): Promise<string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey.trim()) {
      headers.Authorization = `Bearer ${this.apiKey.trim()}`;
    }

    const response = await fetch(`${trimUrl(this.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId.replace('openai:', ''),
        messages: [{ role: 'user', content: input }],
        stream: true,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Provider respondeu com status ${response.status}`);
    }

    return readServerSentEvents(response, onToken);
  }
}

async function readJsonLines(
  response: Response,
  tokenKey: string,
  onToken?: (token: string) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const parsed = JSON.parse(line);
      const token = parsed[tokenKey] ?? '';
      output += token;
      onToken?.(token);
    }
  }

  return output;
}

async function readServerSentEvents(response: Response, onToken?: (token: string) => void) {
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const data = event
        .split('\n')
        .find((line) => line.startsWith('data:'))
        ?.replace(/^data:\s*/, '');

      if (!data || data === '[DONE]') {
        continue;
      }

      const parsed = JSON.parse(data);
      const token = parsed.choices?.[0]?.delta?.content ?? '';
      output += token;
      onToken?.(token);
    }
  }

  return output;
}

function trimUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
