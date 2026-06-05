import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitBranchManager } from '@/components/Git/GitBranchManager';

global.window = Object.create(window);
const mockBranches = [
  { name: 'main', isCurrent: true, upstream: 'origin/main', ahead: 0, behind: 0 },
  { name: 'feature/test', isCurrent: false, upstream: null, ahead: 1, behind: 0 },
];

describe('GitBranchManager', () => {
  it('renders branch list', async () => {
    (window as any).jarvis = { gitBranches: vi.fn().mockResolvedValue(mockBranches), gitCheckout: vi.fn(), gitCreateBranch: vi.fn(), gitDeleteBranch: vi.fn() };
    render(<GitBranchManager repoPath="/test" />);
    expect(await screen.findByText('main')).toBeInTheDocument();
    expect(screen.getByText('feature/test')).toBeInTheDocument();
  });

  it('renders create branch input', async () => {
    render(<GitBranchManager repoPath="/test" />);
    expect(screen.getByPlaceholderText(/new branch/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });
});
