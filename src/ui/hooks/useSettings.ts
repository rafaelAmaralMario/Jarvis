import { useEffect, useState, useRef } from 'react';
import type { ModelHealth, PermissionId, SettingsState } from '../../shared/types';
import type { ProviderKind } from '../../domain';
import { loadSettings as loadPersistedSettings, saveSettings } from '../../shared/persistence';
import { modelRegistry } from '../../application/model-registry';
import { createSettingsService, type SettingsService } from '../../application/services/settings';

const defaultSettings: SettingsState = {
  selectedModelId: modelRegistry.defaultId,
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
  const serviceRef = useRef<SettingsService | null>(null);
  function getService() {
    if (!serviceRef.current) {
      serviceRef.current = createSettingsService(addLog, addAudit);
    }
    return serviceRef.current;
  }

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
    const apiKey = await getService().loadSecureApiKey();
    setSecureApiKey(apiKey);
  }

  async function persistSecureApiKey(value = secureApiKey) {
    await getService().persistSecureApiKey(value);
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
    const health = await getService().testSelectedModel(settings, secureApiKey);
    setModelHealth(health);
    setModelTestActive(false);
  }

  async function startSelectedOllamaModel() {
    await getService().startSelectedOllamaModel(settings.selectedModelId);
    setSettings((current) => ({
      ...current,
      providerKind: 'ollama',
    }));
  }

  async function initializeOllamaModelsPath() {
    const path = await getService().initializeOllamaModelsPath(settings.ollamaModelsPath);
    if (!path) {
      return;
    }

    setSettings((current) => ({ ...current, ollamaModelsPath: current.ollamaModelsPath || path }));
    await refreshOllamaModels(path, { quiet: true });
  }

  async function refreshOllamaModels(path = settings.ollamaModelsPath, options?: { quiet?: boolean }) {
    const result = await getService().refreshOllamaModels(path, options);
    setLocalOllamaModels(result.models);
    setOllamaModelsError(result.error);
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
