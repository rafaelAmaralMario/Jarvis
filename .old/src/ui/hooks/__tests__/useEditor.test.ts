import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditor } from '../useEditor';
import { defaultAddLog, makeMockEditorTab } from './test-utils';

const mockSaveFile = vi.fn();
vi.mock('../../../application/services/editor', () => ({
  createEditorService: () => ({ saveFile: mockSaveFile }),
}));

describe('useEditor', () => {
  const entry = { name: 'test.ts', path: '/workspace/src/test.ts', kind: 'file' as const, children: [] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty tabs', () => {
    const { result } = renderHook(() => useEditor('', defaultAddLog));
    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTabPath).toBe('');
  });

  it('should initialize with provided tabs', () => {
    const tab = makeMockEditorTab();
    const { result } = renderHook(() => useEditor('', defaultAddLog, { initialTabs: [tab] }));
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabPath).toBe(tab.path);
  });

  it('should open a file and add tab', async () => {
    const readTextFile = vi.fn().mockResolvedValue({ path: entry.path, content: 'console.log' });
    const languageFromPath = vi.fn().mockReturnValue('typescript');
    const { result } = renderHook(() => useEditor('/workspace', defaultAddLog));
    await act(async () => {
      await result.current.openFile(entry, readTextFile, languageFromPath);
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabPath).toBe(entry.path);
  });

  it('should not add duplicate tab for already open file', async () => {
    const tab = makeMockEditorTab();
    const readTextFile = vi.fn().mockResolvedValue({ path: entry.path, content: 'console.log' });
    const languageFromPath = vi.fn().mockReturnValue('typescript');
    const { result } = renderHook(() => useEditor('/workspace', defaultAddLog, { initialTabs: [tab] }));
    expect(result.current.tabs).toHaveLength(1);
    await act(async () => {
      await result.current.openFile(entry, readTextFile, languageFromPath);
    });
    expect(result.current.tabs).toHaveLength(1);
  });

  it('should ignore directory entries', async () => {
    const readTextFile = vi.fn();
    const languageFromPath = vi.fn();
    const dirEntry = { name: 'src', path: '/workspace/src', kind: 'directory' as const, children: [] };
    const { result } = renderHook(() => useEditor('/workspace', defaultAddLog));
    await act(async () => {
      await result.current.openFile(dirEntry, readTextFile, languageFromPath);
    });
    expect(result.current.tabs).toHaveLength(0);
  });

  it('should close tab by path', () => {
    const tab = makeMockEditorTab();
    const { result } = renderHook(() => useEditor('', defaultAddLog, { initialTabs: [tab] }));
    act(() => { result.current.closeTabByPath(tab.path); });
    expect(result.current.tabs).toHaveLength(0);
  });

  it('should close tab with dirty guard', () => {
    const dirtyTab = makeMockEditorTab({ content: 'changed', savedContent: 'original' });
    const onCloseDirty = vi.fn();
    const { result } = renderHook(() => useEditor('', defaultAddLog, { initialTabs: [dirtyTab] }));
    act(() => { result.current.closeTab(dirtyTab, onCloseDirty); });
    expect(onCloseDirty).toHaveBeenCalledWith(dirtyTab);
    expect(result.current.tabs).toHaveLength(1);
  });

  it('should update active tab content', () => {
    const tab = makeMockEditorTab();
    const { result } = renderHook(() => useEditor('', defaultAddLog, { initialTabs: [tab] }));
    act(() => { result.current.updateActiveTab('const y = 2;'); });
    expect(result.current.tabs[0].content).toBe('const y = 2;');
  });

  it('should save active file', async () => {
    mockSaveFile.mockResolvedValue(undefined);
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const tab = makeMockEditorTab();
    const { result } = renderHook(() => useEditor('/workspace', defaultAddLog, { initialTabs: [tab] }));
    await act(async () => {
      await result.current.saveActiveFile(onSaved, []);
    });
    expect(mockSaveFile).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it('should block saving for deny-listed files', async () => {
    const onSaved = vi.fn();
    const tab = makeMockEditorTab({ path: 'welcome.md' });
    const { result } = renderHook(() => useEditor('', defaultAddLog, { initialTabs: [tab] }));
    await act(async () => {
      await result.current.saveActiveFile(onSaved, ['welcome.md']);
    });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('should detect dirty tabs', () => {
    const clean = makeMockEditorTab();
    const dirty = makeMockEditorTab({ path: '/dirty.ts', content: 'changed', savedContent: 'original' });
    const { result } = renderHook(() => useEditor('', defaultAddLog, { initialTabs: [clean, dirty] }));
    expect(result.current.dirtyTabs).toHaveLength(1);
    expect(result.current.dirtyTabs[0].path).toBe('/dirty.ts');
  });
});
