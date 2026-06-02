import type { ProviderSettings, TextModelProvider } from '../domain';
import { mockTextProvider } from './providers/mock';
import { OllamaTextProvider } from './providers/ollama';
import { OpenAICompatibleTextProvider } from './providers/openai';

export { mockTextProvider } from './providers/mock';

export function createTextProvider(settings: ProviderSettings): TextModelProvider {
  if (settings.kind === 'ollama') {
    return new OllamaTextProvider(settings.baseUrl);
  }

  if (settings.kind === 'openai-compatible') {
    return new OpenAICompatibleTextProvider(settings.baseUrl, settings.apiKey ?? '');
  }

  return mockTextProvider;
}
