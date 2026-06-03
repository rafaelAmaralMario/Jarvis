import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GitPanel } from '../GitPanel';
import { mockGitStatus, mockGitBranches } from '../../hooks/__tests__/test-utils';

describe('GitPanel', () => {
  const defaultProps = {
    gitFiles: [] as typeof mockGitStatus,
    gitBranches: [] as typeof mockGitBranches,
    commitMessage: '',
    branchName: '',
    prUrl: '',
    onRefreshWorkspace: vi.fn(),
    onCommitMessageChange: vi.fn(),
    onBranchNameChange: vi.fn(),
    onSuggestCommitMessage: vi.fn(),
    onCreateCommit: vi.fn(),
    onCreateBranch: vi.fn(),
    onCheckoutBranch: vi.fn(),
    onCreatePullRequestUrl: vi.fn(),
    onOpenDiff: vi.fn(),
    onStageFile: vi.fn(),
    onUnstageFile: vi.fn(),
  };

  it('should render empty state', () => {
    render(<GitPanel {...defaultProps} />);
    expect(screen.getByText(/Nenhuma mudanca Git/i)).toBeInTheDocument();
  });

  it('should render files when provided', () => {
    render(<GitPanel {...defaultProps} gitFiles={mockGitStatus} />);
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
  });

  it('should render branches', () => {
    render(<GitPanel {...defaultProps} gitBranches={mockGitBranches} />);
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('feature/test')).toBeInTheDocument();
  });

  it('should render PR URL when provided', () => {
    render(<GitPanel {...defaultProps} prUrl="https://github.com/owner/repo/pull/1" />);
    const link = screen.getByText('Abrir Pull Request');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/owner/repo/pull/1');
  });
});
