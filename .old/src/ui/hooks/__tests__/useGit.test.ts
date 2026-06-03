import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGit } from '../useGit';
import { mockGitStatus, mockGitBranches, defaultAddLog, defaultAddAudit } from './test-utils';

const mockService = {
  openDiff: vi.fn(),
  stageFile: vi.fn(),
  unstageFile: vi.fn(),
  createCommit: vi.fn(),
  suggestCommitMessage: vi.fn(),
  createBranch: vi.fn(),
  checkoutBranch: vi.fn(),
  createPullRequestUrl: vi.fn(),
};

vi.mock('../../../application/services/git', () => ({
  createGitService: () => mockService,
}));

describe('useGit', () => {
  const onWorkspaceChanged = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    expect(result.current.gitFiles).toEqual([]);
    expect(result.current.gitBranches).toEqual([]);
    expect(result.current.commitMessage).toBe('');
  });

  it('should open diff for file', async () => {
    mockService.openDiff.mockResolvedValue('mock diff content');
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    await act(async () => {
      await result.current.openDiff('src/index.ts');
    });
    expect(result.current.selectedGitFile).toBe('src/index.ts');
    expect(result.current.diff).toBe('mock diff content');
  });

  it('should stage file', async () => {
    mockService.stageFile.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    await act(async () => {
      await result.current.stageFile('src/index.ts');
    });
    expect(mockService.stageFile).toHaveBeenCalledWith('/workspace', 'src/index.ts');
  });

  it('should unstage file', async () => {
    mockService.unstageFile.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    await act(async () => {
      await result.current.unstageFile('src/index.ts');
    });
    expect(mockService.unstageFile).toHaveBeenCalledWith('/workspace', 'src/index.ts');
  });

  it('should create commit and clear message', async () => {
    mockService.createCommit.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    act(() => { result.current.setCommitMessage('feat: test'); });
    await act(async () => {
      await result.current.createCommit('feat: test');
    });
    expect(mockService.createCommit).toHaveBeenCalledWith('/workspace', 'feat: test');
    expect(result.current.commitMessage).toBe('');
  });

  it('should suggest commit message', () => {
    mockService.suggestCommitMessage.mockReturnValue('feat: update files');
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    act(() => { result.current.suggestCommitMessage(); });
    expect(result.current.commitMessage).toBe('feat: update files');
  });

  it('should create and checkout branches', async () => {
    mockService.createBranch.mockResolvedValue(undefined);
    mockService.checkoutBranch.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    await act(async () => {
      await result.current.createBranch('feature/test');
    });
    expect(mockService.createBranch).toHaveBeenCalledWith('/workspace', 'feature/test');
    expect(result.current.branchName).toBe('');

    await act(async () => {
      await result.current.checkoutBranch('main');
    });
    expect(mockService.checkoutBranch).toHaveBeenCalledWith('/workspace', 'main');
  });

  it('should generate PR URL', async () => {
    mockService.createPullRequestUrl.mockResolvedValue('https://github.com/owner/repo/pull/1');
    const { result } = renderHook(() => useGit('/workspace', defaultAddLog, defaultAddAudit, onWorkspaceChanged));
    await act(async () => {
      await result.current.createPullRequestUrl();
    });
    expect(result.current.prUrl).toBe('https://github.com/owner/repo/pull/1');
  });
});
