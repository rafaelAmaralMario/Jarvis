import type { TextModelProvider, TextProviderRequest } from '../../domain';
import { trimUrl } from './utils';

export class OpenAICompatibleTextProvider implements TextModelProvider {
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
