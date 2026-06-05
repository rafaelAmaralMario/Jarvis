import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitCommitBox } from '@/components/Git/GitCommitBox';

describe('GitCommitBox', () => {
  it('renders textarea and commit button', () => {
    render(<GitCommitBox repoPath="/test" hasChanges onCommit={vi.fn()} />);
    expect(screen.getByPlaceholderText(/commit message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commit/i })).toBeInTheDocument();
  });

  it('commit button disabled when no message', () => {
    render(<GitCommitBox repoPath="/test" hasChanges onCommit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /commit/i })).toBeDisabled();
  });

  it('commit button disabled when no changes', () => {
    render(<GitCommitBox repoPath="/test" hasChanges={false} onCommit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /commit/i })).toBeDisabled();
  });

  it('enables commit button with message and changes', async () => {
    const user = userEvent.setup();
    render(<GitCommitBox repoPath="/test" hasChanges onCommit={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/commit message/i);
    await user.type(textarea, 'fix: important bug');
    expect(screen.getByRole('button', { name: /commit/i })).toBeEnabled();
  });
});
