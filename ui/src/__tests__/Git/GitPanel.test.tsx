import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitPanel } from '@/components/Git/GitPanel';

vi.mock('@/components/Git/GitStatusList', () => ({
  GitStatusList: () => <div data-testid="git-status-list">Status List</div>,
}));

vi.mock('@/components/Git/GitCommitBox', () => ({
  GitCommitBox: () => <div data-testid="git-commit-box">Commit Box</div>,
}));

vi.mock('@/components/Git/GitHistoryView', () => ({
  GitHistoryView: () => <div data-testid="git-history-view">History View</div>,
}));

vi.mock('@/components/Git/GitBranchManager', () => ({
  GitBranchManager: () => <div data-testid="git-branch-manager">Branch Manager</div>,
}));

describe('GitPanel', () => {
  it('renders changes tab by default', () => {
    render(<GitPanel repoPath="/test/repo" />);
    expect(screen.getByText(/Changes/i)).toBeInTheDocument();
    expect(screen.getByTestId('git-status-list')).toBeInTheDocument();
  });

  it('switches to history tab on click', async () => {
    const user = userEvent.setup();
    render(<GitPanel repoPath="/test/repo" />);
    await user.click(screen.getByText(/History/i));
    expect(screen.getByTestId('git-history-view')).toBeInTheDocument();
  });

  it('switches to branches tab on click', async () => {
    const user = userEvent.setup();
    render(<GitPanel repoPath="/test/repo" />);
    await user.click(screen.getByText(/Branches/i));
    expect(screen.getByTestId('git-branch-manager')).toBeInTheDocument();
  });
});
