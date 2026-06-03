import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings, defaultSettings } from '../useSettings';
import { defaultAddLog } from './test-utils';

const mockService = {
  loadSecureApiKey: vi.fn(),
  persistSecureApiKey: vi.fn(),
  testSelectedModel: vi.fn(),
  startSelectedOllamaModel: vi.fn(),
  initializeOllamaModelsPath: vi.fn(),
  refreshOllamaModels: vi.fn(),
};

const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn();

vi.mock('../../../shared/persistence', () => ({
  loadSettings: (...args: unknown[]) => mockLoadSettings(...args),
  saveSettings: (...args: unknown[]) => mockSaveSettings(...args),
}));

vi.mock('../../../application/services/settings', () => ({
  createSettingsService: () => mockService,
}));

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSettings.mockReturnValue(defaultSettings);
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSettings(defaultAddLog));
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.providerKind).toBe('mock');
    expect(result.current.modelHealth).toBe('unknown');
  });

  it('should update provider kind', () => {
    const { result } = renderHook(() => useSettings(defaultAddLog));
    const models = [
      { id: 'ollama:llama3.2', providerId: 'ollama' },
      { id: 'mock-text', providerId: 'mock' },
    ];
    act(() => { result.current.updateProviderKind('ollama', models); });
    expect(result.current.settings.providerKind).toBe('ollama');
  });

  it('should update permission', () => {
    const { result } = renderHook(() => useSettings(defaultAddLog));
    act(() => { result.current.updatePermission('write-workspace', true); });
    expect(result.current.settings.permissions['write-workspace']).toBe(true);
  });

  it('should test selected model', async () => {
    mockService.testSelectedModel.mockResolvedValue('ok');
    const { result } = renderHook(() => useSettings(defaultAddLog));
    await act(async () => {
      await result.current.testSelectedModel();
    });
    expect(result.current.modelHealth).toBe('ok');
    expect(result.current.modelTestActive).toBe(false);
  });

  it('should load secure settings', async () => {
    mockService.loadSecureApiKey.mockResolvedValue('sk-test');
    const { result } = renderHook(() => useSettings(defaultAddLog));
    await act(async () => {
      await result.current.initializeSecureSettings();
    });
    expect(result.current.secureApiKey).toBe('sk-test');
  });

  it('should persist secure API key', async () => {
    mockService.persistSecureApiKey.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSettings(defaultAddLog));
    act(() => { result.current.setSecureApiKey('sk-new'); });
    await act(async () => {
      await result.current.persistSecureApiKey();
    });
    expect(mockService.persistSecureApiKey).toHaveBeenCalledWith('sk-new');
  });

  it('should start selected Ollama model', async () => {
    mockService.startSelectedOllamaModel.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSettings(defaultAddLog));
    await act(async () => {
      await result.current.startSelectedOllamaModel();
    });
    expect(result.current.settings.providerKind).toBe('ollama');
  });

  it('should refresh Ollama models', async () => {
    mockService.refreshOllamaModels.mockResolvedValue({ models: ['llama3.2', 'qwen2.5'], error: '' });
    const { result } = renderHook(() => useSettings(defaultAddLog));
    await act(async () => {
      await result.current.refreshOllamaModels('/models');
    });
    expect(result.current.localOllamaModels).toEqual(['llama3.2', 'qwen2.5']);
  });

  it('should persist settings on change', () => {
    renderHook(() => useSettings(defaultAddLog));
    expect(mockSaveSettings).toHaveBeenCalled();
  });
});
