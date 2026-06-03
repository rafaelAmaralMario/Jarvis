import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlugins } from '../usePlugins';
import { mockPlugins, defaultAddLog, defaultAddAudit } from './test-utils';

const mockService = {
  canTogglePlugin: vi.fn(),
  refreshLocalPlugins: vi.fn(),
};

vi.mock('../../../application/services/plugins', () => ({
  createPluginService: () => mockService,
}));

describe('usePlugins', () => {
  const mockPermissions = { 'read-workspace': true, 'write-workspace': false, git: true, network: false, secrets: false };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty enabled plugins', () => {
    const { result } = renderHook(() => usePlugins(defaultAddLog, defaultAddAudit));
    expect(result.current.enabledPlugins).toEqual([]);
  });

  it('should enable a plugin via toggle', () => {
    mockService.canTogglePlugin.mockReturnValue(true);
    const { result } = renderHook(() => usePlugins(defaultAddLog, defaultAddAudit));
    act(() => { result.current.togglePlugin(mockPlugins[0], mockPermissions); });
    expect(result.current.enabledPlugins).toContain('mock-provider');
  });

  it('should disable a plugin via toggle', () => {
    mockService.canTogglePlugin.mockReturnValue(true);
    const { result } = renderHook(() => usePlugins(defaultAddLog, defaultAddAudit));
    act(() => { result.current.togglePlugin(mockPlugins[0], mockPermissions); });
    expect(result.current.enabledPlugins).toHaveLength(1);
    act(() => { result.current.togglePlugin(mockPlugins[0], mockPermissions); });
    expect(result.current.enabledPlugins).not.toContain('mock-provider');
  });

  it('should not toggle plugin when blocked', () => {
    mockService.canTogglePlugin.mockReturnValue(false);
    const { result } = renderHook(() => usePlugins(defaultAddLog, defaultAddAudit));
    act(() => { result.current.togglePlugin(mockPlugins[0], mockPermissions); });
    expect(result.current.enabledPlugins).not.toContain('mock-provider');
  });

  it('should load local plugins', async () => {
    mockService.refreshLocalPlugins.mockResolvedValue([{ id: 'local-plugin', name: 'Local', capabilities: [], permissions: [] }]);
    const { result } = renderHook(() => usePlugins(defaultAddLog, defaultAddAudit));
    await act(async () => {
      await result.current.refreshLocalPlugins('/workspace');
    });
    expect(result.current.localPlugins).toHaveLength(1);
    expect(result.current.localPlugins[0].id).toBe('local-plugin');
  });
});
