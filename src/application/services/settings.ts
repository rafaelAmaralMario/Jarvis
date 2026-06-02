import {
  getDefaultOllamaModelsPath,
  listOllamaModels,
  loadSecureSettings,
  saveSecureSettings,
  startOllamaModel,
  testOllamaModel,
} from '../../infrastructure/native';
import { createTextProvider } from '../../infrastructure/model-providers';
import { formatError } from '../../shared/utils';
import type { SettingsState } from '../../shared/types';

export function createSettingsService(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit?: (actor: string, permission: string, target: string, result: string) => void,
) {
  async function loadSecureApiKey(): Promise<string> {
    try {
      const secureSettings = await loadSecureSettings();
      return secureSettings.openaiCompatibleApiKey;
    } catch (error) {
      addLog(`Configuracao sensivel nao carregada: ${String(error)}`, 'warn');
      return '';
    }
  }

  async function persistSecureApiKey(value: string): Promise<void> {
    try {
      await saveSecureSettings({ openaiCompatibleApiKey: value });
      addLog('Chave sensivel salva no backend local', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  async function testSelectedModel(
    settings: SettingsState,
    secureApiKey: string,
  ): Promise<'ok' | 'fail'> {
    if (settings.providerKind === 'ollama') {
      try {
        const model = settings.selectedModelId.replace('ollama:', '');
        const response = await testOllamaModel(model);
        addLog(`Modelo funcional: Ollama respondeu "${response?.slice(0, 60) || 'OK'}"`, 'ok');
        addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste Ollama concluido');
        return 'ok';
      } catch (error) {
        addLog(`Teste Ollama falhou: ${formatError(error)}`, 'warn');
        addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste Ollama falhou');
        return 'fail';
      }
    }

    const provider = createTextProvider({
      kind: settings.providerKind,
      modelId: settings.selectedModelId,
      baseUrl: settings.openaiCompatibleBaseUrl,
      apiKey: secureApiKey,
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await provider.sendMessage({
        input: 'Responda apenas OK para confirmar que o modelo esta funcional.',
        modelId: settings.selectedModelId,
        signal: controller.signal,
      });
      addLog(`Modelo funcional: ${provider.name} respondeu "${response?.slice(0, 60) || 'OK'}"`, 'ok');
      addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste concluido');
      return 'ok';
    } catch (error) {
      const canceled = error instanceof DOMException && error.name === 'AbortError';
      addLog(
        canceled
          ? 'Teste do modelo excedeu 12 segundos'
          : `Teste do modelo falhou: ${formatError(error)}`,
        'warn',
      );
      addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste falhou');
      return 'fail';
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function startSelectedOllamaModel(modelId: string): Promise<void> {
    try {
      const model = modelId.replace('ollama:', '');
      await startOllamaModel(model);
      addLog(`Comando iniciado: ollama run ${model}`, 'ok');
    } catch (error) {
      addLog(`Nao foi possivel iniciar o modelo selecionado: ${formatError(error)}`, 'warn');
    }
  }

  async function initializeOllamaModelsPath(currentPath: string): Promise<string | null> {
    const path = currentPath || (await getDefaultOllamaModelsPath());
    return path || null;
  }

  async function refreshOllamaModels(
    path: string,
    options?: { quiet?: boolean },
  ): Promise<{ models: string[]; error: string }> {
    if (!path.trim()) {
      return { models: [], error: 'Informe a pasta de modelos do Ollama.' };
    }

    try {
      const detectedModels = await listOllamaModels(path);
      if (!options?.quiet) {
        addLog(`${detectedModels.length} modelos Ollama detectados`, 'ok');
      }
      return { models: detectedModels, error: '' };
    } catch (error) {
      const message = `Modelos Ollama nao carregados: ${formatError(error)}`;
      if (!options?.quiet) {
        addLog(message, 'warn');
      }
      return { models: [], error: message };
    }
  }

  return {
    loadSecureApiKey,
    persistSecureApiKey,
    testSelectedModel,
    startSelectedOllamaModel,
    initializeOllamaModelsPath,
    refreshOllamaModels,
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
