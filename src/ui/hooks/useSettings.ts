import { useEffect, useState } from 'react';
import type { ModelHealth, PermissionId, SettingsState } from '../../shared/types';
import type { ProviderKind } from '../../domain';
import { loadSettings as loadPersistedSettings, saveSettings } from '../../shared/persistence';
import { defaultModelId } from '../../application/model-registry';
import { createTextProvider } from '../../infrastructure/model-providers';
import { getDefaultOllamaModelsPath, listOllamaModels, loadSecureSettings, saveSecureSettings, startOllamaModel, testOllamaModel } from '../../infrastructure/native';
import { formatError } from '../../shared/utils';

const defaultSettings: SettingsState = {
  selectedModelId: defaultModelId,
  providerKind: 'mock',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModelsPath: '',
  openaiCompatibleBaseUrl: 'https://api.openai.com/v1',
  generalVaultPath: '',
  projectVaultPath: '',
  contextVaultKind: 'project',
  workspacePath: '',
  theme: 'dark',
  sidebarWidth: 300,
  aiPanelWidth: 380,
  permissions: {
    'read-workspace': true,
    'write-workspace': false,
    git: true,
    network: false,
    secrets: false,
  },
};

export { defaultSettings };

export function useSettings(
  addLog: (message: string, status?: 'ok' | 'warn') => void,
  addAudit?: (actor: string, permission: string, target: string, result: string) => void,
) {
  const [settings, setSettings] = useState<SettingsState>(() => loadPersistedSettings(defaultSettings));
  const [secureApiKey, setSecureApiKey] = useState('');
  const [modelHealth, setModelHealth] = useState<ModelHealth>('unknown');
  const [modelTestActive, setModelTestActive] = useState(false);
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([]);
  const [ollamaModelsError, setOllamaModelsError] = useState('');

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    setModelHealth('unknown');
  }, [settings.providerKind, settings.selectedModelId, settings.ollamaBaseUrl, settings.openaiCompatibleBaseUrl]);

  async function initializeSecureSettings() {
    try {
      const secureSettings = await loadSecureSettings();
      setSecureApiKey(secureSettings.openaiCompatibleApiKey);
    } catch (error) {
      addLog(`Configuracao sensivel nao carregada: ${String(error)}`, 'warn');
    }
  }

  async function persistSecureApiKey(value = secureApiKey) {
    try {
      await saveSecureSettings({ openaiCompatibleApiKey: value });
      addLog('Chave sensivel salva no backend local', 'ok');
    } catch (error) {
      addLog(String(error), 'warn');
    }
  }

  function updateProviderKind(providerKind: ProviderKind, providerModels: Array<{ id: string; providerId: string }>) {
    const firstModel = providerModels.find((model) => model.providerId === providerKind) ?? providerModels[0];
    setSettings((current) => ({
      ...current,
      providerKind,
      selectedModelId: firstModel?.id ?? current.selectedModelId,
    }));
  }

  function updatePermission(permission: PermissionId, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      permissions: { ...current.permissions, [permission]: enabled },
    }));
  }

  async function testSelectedModel() {
    if (modelTestActive) return;

    setModelTestActive(true);
    if (settings.providerKind === 'ollama') {
      try {
        const model = settings.selectedModelId.replace('ollama:', '');
        const response = await testOllamaModel(model);
        setModelHealth('ok');
        addLog(`Modelo funcional: Ollama respondeu "${response.slice(0, 60) || 'OK'}"`, 'ok');
        addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste Ollama concluido');
      } catch (error) {
        setModelHealth('fail');
        addLog(`Teste Ollama falhou: ${formatError(error)}`, 'warn');
        addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste Ollama falhou');
      } finally {
        setModelTestActive(false);
      }
      return;
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
      setModelHealth('ok');
      addLog(`Modelo funcional: ${provider.name} respondeu "${response.slice(0, 60) || 'OK'}"`, 'ok');
      addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste concluido');
    } catch (error) {
      const canceled = error instanceof DOMException && error.name === 'AbortError';
      setModelHealth('fail');
      addLog(
        canceled
          ? 'Teste do modelo excedeu 12 segundos'
          : `Teste do modelo falhou: ${formatError(error)}`,
        'warn',
      );
      addAudit?.('Model Tester', 'network', settings.selectedModelId, 'Teste falhou');
    } finally {
      window.clearTimeout(timeout);
      setModelTestActive(false);
    }
  }

  async function startSelectedOllamaModel() {
    try {
      const model = settings.selectedModelId.replace('ollama:', '');
      await startOllamaModel(model);
      setSettings((current) => ({
        ...current,
        providerKind: 'ollama',
      }));
      addLog(`Comando iniciado: ollama run ${model}`, 'ok');
    } catch (error) {
      addLog(`Nao foi possivel iniciar o modelo selecionado: ${formatError(error)}`, 'warn');
    }
  }

  async function initializeOllamaModelsPath() {
    const path = settings.ollamaModelsPath || (await getDefaultOllamaModelsPath());
    if (!path) {
      return;
    }

    setSettings((current) => ({ ...current, ollamaModelsPath: current.ollamaModelsPath || path }));
    await refreshOllamaModels(path, { quiet: true });
  }

  async function refreshOllamaModels(path = settings.ollamaModelsPath, options?: { quiet?: boolean }) {
    if (!path.trim()) {
      setLocalOllamaModels([]);
      setOllamaModelsError('Informe a pasta de modelos do Ollama.');
      return;
    }

    try {
      const detectedModels = await listOllamaModels(path);
      setLocalOllamaModels(detectedModels);
      setOllamaModelsError('');
      if (!options?.quiet) {
        addLog(`${detectedModels.length} modelos Ollama detectados`, 'ok');
      }
    } catch (error) {
      setLocalOllamaModels([]);
      const message = `Modelos Ollama nao carregados: ${formatError(error)}`;
      setOllamaModelsError(message);
      if (!options?.quiet) {
        addLog(message, 'warn');
      }
    }
  }

  return {
    settings,
    setSettings,
    secureApiKey,
    setSecureApiKey,
    modelHealth,
    modelTestActive,
    localOllamaModels,
    ollamaModelsError,
    initializeSecureSettings,
    initializeOllamaModelsPath,
    persistSecureApiKey,
    updateProviderKind,
    updatePermission,
    testSelectedModel,
    startSelectedOllamaModel,
    refreshOllamaModels,
  };
}
