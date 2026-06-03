import { createWorkspaceService } from '../workspace';

vi.mock('../../../infrastructure/native', () => ({
  listWorkspaceEntries: vi.fn(),
  searchWorkspace: vi.fn(),
}));

describe('WorkspaceService', () => {
  const addLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns entries from listWorkspaceEntries', async () => {
    const { listWorkspaceEntries } = await import('../../../infrastructure/native');
    const mockEntries = [{ name: 'src', path: '/workspace/src', kind: 'directory', children: [] }];
    vi.mocked(listWorkspaceEntries).mockResolvedValue(mockEntries);

    const service = createWorkspaceService(addLog);
    const result = await service.refresh('/workspace');

    expect(result).toEqual(mockEntries);
    expect(addLog).toHaveBeenCalledWith('Workspace atualizado: /workspace', 'ok');
  });

  it('returns empty array for empty path', async () => {
    const service = createWorkspaceService(addLog);
    const result = await service.refresh('');

    expect(result).toEqual([]);
    expect(addLog).not.toHaveBeenCalled();
  });

  it('handles listWorkspaceEntries error', async () => {
    const { listWorkspaceEntries } = await import('../../../infrastructure/native');
    vi.mocked(listWorkspaceEntries).mockRejectedValue(new Error('permission denied'));

    const service = createWorkspaceService(addLog);

    await expect(service.refresh('/workspace')).rejects.toThrow('permission denied');
    expect(addLog).toHaveBeenCalledWith(expect.stringContaining('permission denied'), 'warn');
  });

  it('does not log when quiet option is set', async () => {
    const { listWorkspaceEntries } = await import('../../../infrastructure/native');
    vi.mocked(listWorkspaceEntries).mockResolvedValue([]);

    const service = createWorkspaceService(addLog);
    await service.refresh('/workspace', { quiet: true });

    expect(addLog).not.toHaveBeenCalled();
  });

  it('returns search results from searchWorkspace', async () => {
    const { searchWorkspace } = await import('../../../infrastructure/native');
    const mockResults = [{ path: '/workspace/file.ts', line: 1, preview: 'test' }];
    vi.mocked(searchWorkspace).mockResolvedValue(mockResults);

    const service = createWorkspaceService(addLog);
    const results = await service.runSearch('/workspace', 'test');

    expect(results).toEqual(mockResults);
    expect(addLog).toHaveBeenCalledWith('1 resultados encontrados', 'ok');
  });

  it('returns empty results for empty query', async () => {
    const service = createWorkspaceService(addLog);
    const results = await service.runSearch('/workspace', '');

    expect(results).toEqual([]);
  });
});
