import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspace } from '../useWorkspace';
import { mockWorkspaceFiles, defaultAddLog } from './test-utils';

const mockRefresh = vi.fn();
const mockRunSearch = vi.fn();

vi.mock('../../../application/services/workspace', () => ({
  createWorkspaceService: () => ({
    refresh: mockRefresh,
    runSearch: mockRunSearch,
  }),
}));

describe('useWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh.mockResolvedValue([]);
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    expect(result.current.files).toEqual([]);
    expect(result.current.workspacePath).toBe('');
    expect(result.current.workspaceLoadError).toBe('');
    expect(result.current.searchResults).toEqual([]);
  });

  it('should load workspace files on refresh', async () => {
    mockRefresh.mockResolvedValue(mockWorkspaceFiles);
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    await act(async () => {
      await result.current.refreshWorkspace('/workspace');
    });
    expect(result.current.files).toEqual(mockWorkspaceFiles);
    expect(result.current.workspaceLoadError).toBe('');
  });

  it('should clear files when refresh without path', async () => {
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    await act(async () => {
      await result.current.refreshWorkspace('');
    });
    expect(result.current.files).toEqual([]);
    expect(result.current.workspaceLoadError).toBeTruthy();
  });

  it('should handle refresh errors gracefully', async () => {
    mockRefresh.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    await act(async () => {
      await result.current.refreshWorkspace('/workspace');
    });
    expect(result.current.files).toEqual([]);
    expect(result.current.workspaceLoadError).toBeTruthy();
  });

  it('should toggle folder expansion', () => {
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    act(() => { result.current.toggleFolder('/workspace/src'); });
    expect(result.current.expandedFolders.has('/workspace/src')).toBe(true);
    act(() => { result.current.toggleFolder('/workspace/src'); });
    expect(result.current.expandedFolders.has('/workspace/src')).toBe(false);
  });

  it('should run search and update results', async () => {
    const mockResults = [{ path: '/workspace/src/index.ts', line: 5, preview: 'import' }];
    mockRunSearch.mockResolvedValue(mockResults);
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    await act(async () => {
      await result.current.runSearch('import');
    });
    expect(result.current.searchResults).toEqual(mockResults);
  });

  it('should clear search results for empty query', async () => {
    const { result } = renderHook(() => useWorkspace(defaultAddLog));
    act(() => { result.current.setSearchResults(mockWorkspaceFiles); });
    await act(async () => {
      await result.current.runSearch('');
    });
    expect(result.current.searchResults).toEqual([]);
  });
});
