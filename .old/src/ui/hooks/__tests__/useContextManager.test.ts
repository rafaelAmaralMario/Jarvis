import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContextManager } from '../useContextManager';
import { defaultAddLog, defaultAddAudit } from './test-utils';

const mockService = {
  loadObsidianNotes: vi.fn(),
  writeMemoryToObsidian: vi.fn(),
};

vi.mock('../../../application/services/context', () => ({
  createContextService: () => mockService,
}));

describe('useContextManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    expect(result.current.notes).toEqual([]);
    expect(result.current.memoryEntries).toEqual([]);
    expect(result.current.memoryInput).toBe('');
  });

  it('should load Obsidian notes', async () => {
    const mockNotes = [{ path: '/vault/note.md', title: 'Test Note', content: '# Test' }];
    mockService.loadObsidianNotes.mockResolvedValue(mockNotes);
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    await act(async () => {
      await result.current.loadObsidianNotes('/vault');
    });
    expect(result.current.notes).toEqual(mockNotes);
  });

  it('should add memory entry', () => {
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    act(() => { result.current.setMemoryInput('Important decision'); });
    act(() => { result.current.addMemory(); });
    expect(result.current.memoryEntries).toHaveLength(1);
    expect(result.current.memoryEntries[0].content).toBe('Important decision');
    expect(result.current.memoryInput).toBe('');
  });

  it('should not add empty memory', () => {
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    act(() => { result.current.addMemory(); });
    expect(result.current.memoryEntries).toHaveLength(0);
  });

  it('should run context search', () => {
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    act(() => { result.current.setContextQuery('React'); });
    act(() => { result.current.runContextSearch(); });
    expect(Array.isArray(result.current.contextResults)).toBe(true);
  });

  it('should write memory to Obsidian', async () => {
    mockService.writeMemoryToObsidian.mockResolvedValue(undefined);
    mockService.loadObsidianNotes.mockResolvedValue([]);
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    act(() => { result.current.setMemoryInput('test note'); });
    await act(async () => {
      await result.current.writeMemoryToObsidian('/vault', 'project');
    });
    expect(mockService.writeMemoryToObsidian).toHaveBeenCalled();
  });

  it('should skip write if vault path is empty', async () => {
    const { result } = renderHook(() => useContextManager('/workspace', defaultAddLog, defaultAddAudit));
    act(() => { result.current.setMemoryInput('test'); });
    await act(async () => {
      await result.current.writeMemoryToObsidian('', 'project');
    });
    expect(mockService.writeMemoryToObsidian).not.toHaveBeenCalled();
  });
});
