import type { TextModelProvider, TextProviderRequest } from '../../domain';
import { trimUrl } from './utils';

export class OllamaTextProvider implements TextModelProvider {
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
