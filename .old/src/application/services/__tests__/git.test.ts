import { createGitService } from '../git';

vi.mock('../../../infrastructure/native', () => ({
  getGitDiff: vi.fn(),
  stageGitFile: vi.fn(),
  unstageGitFile: vi.fn(),
  commitGit: vi.fn(),
  createGitBranch: vi.fn(),
  checkoutGitBranch: vi.fn(),
  getGithubPrUrl: vi.fn(),
}));

describe('GitService', () => {
  const addLog = vi.fn();
  const addAudit = vi.fn();
  const onWorkspaceChanged = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('openDiff returns diff output', async () => {
    const { getGitDiff } = await import('../../../infrastructure/native');
    vi.mocked(getGitDiff).mockResolvedValue('diff output');

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    const result = await service.openDiff('/workspace', 'file.ts');

    expect(result).toBe('diff output');
    expect(addLog).toHaveBeenCalledWith('Diff carregado: file.ts', 'ok');
  });

  it('openDiff returns fallback when diff is empty', async () => {
    const { getGitDiff } = await import('../../../infrastructure/native');
    vi.mocked(getGitDiff).mockResolvedValue('');

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    const result = await service.openDiff('/workspace', 'file.ts');

    expect(result).toBe('Sem diff textual disponivel para este arquivo.');
  });

  it('stageFile calls stageGitFile and triggers workspace change', async () => {
    const { stageGitFile } = await import('../../../infrastructure/native');
    vi.mocked(stageGitFile).mockResolvedValue(undefined);

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    await service.stageFile('/workspace', 'file.ts');

    expect(stageGitFile).toHaveBeenCalledWith('/workspace', 'file.ts');
    expect(onWorkspaceChanged).toHaveBeenCalled();
    expect(addAudit).toHaveBeenCalledWith('Git', 'git', 'file.ts', 'Stage');
  });

  it('unstageFile calls unstageGitFile', async () => {
    const { unstageGitFile } = await import('../../../infrastructure/native');
    vi.mocked(unstageGitFile).mockResolvedValue(undefined);

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    await service.unstageFile('/workspace', 'file.ts');

    expect(unstageGitFile).toHaveBeenCalledWith('/workspace', 'file.ts');
  });

  it('createCommit calls commitGit', async () => {
    const { commitGit } = await import('../../../infrastructure/native');
    vi.mocked(commitGit).mockResolvedValue(undefined);

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    await service.createCommit('/workspace', 'fix bug');

    expect(commitGit).toHaveBeenCalledWith('/workspace', 'fix bug');
  });

  it('createCommit logs errors without throwing', async () => {
    const { commitGit } = await import('../../../infrastructure/native');
    vi.mocked(commitGit).mockRejectedValue(new Error('git error'));

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    await service.createCommit('/workspace', 'fix bug');

    expect(addLog).toHaveBeenCalledWith('Error: git error', 'warn');
  });

  it('suggestCommitMessage returns summary from files', () => {
    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    const files = [{ path: 'src/file1.ts', status: 'M' }, { path: 'src/file2.ts', status: '?' }];

    const msg = service.suggestCommitMessage(files);

    expect(msg).toBe('chore: update file1.ts, file2.ts');
  });

  it('createBranch calls createGitBranch', async () => {
    const { createGitBranch } = await import('../../../infrastructure/native');
    vi.mocked(createGitBranch).mockResolvedValue(undefined);

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    await service.createBranch('/workspace', 'feature-x');

    expect(createGitBranch).toHaveBeenCalledWith('/workspace', 'feature-x');
    expect(addAudit).toHaveBeenCalledWith('Git', 'git', '/workspace', 'Branch criada');
  });

  it('checkoutBranch calls checkoutGitBranch', async () => {
    const { checkoutGitBranch } = await import('../../../infrastructure/native');
    vi.mocked(checkoutGitBranch).mockResolvedValue(undefined);

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    await service.checkoutBranch('/workspace', 'main');

    expect(checkoutGitBranch).toHaveBeenCalledWith('/workspace', 'main');
  });

  it('createPullRequestUrl returns URL', async () => {
    const { getGithubPrUrl } = await import('../../../infrastructure/native');
    vi.mocked(getGithubPrUrl).mockResolvedValue('https://github.com/pr');

    const service = createGitService(addLog, addAudit, onWorkspaceChanged);
    const url = await service.createPullRequestUrl('/workspace');

    expect(url).toBe('https://github.com/pr');
    expect(addAudit).toHaveBeenCalledWith('GitHub', 'network', '/workspace', 'URL de PR gerada');
  });
});
