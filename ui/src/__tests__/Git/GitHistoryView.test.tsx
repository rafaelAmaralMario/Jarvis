import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GitHistoryView } from '@/components/Git/GitHistoryView';

const mockLog = [
  { hash: 'abc123def456', message: 'Initial commit', author: 'John Doe', date: '2024-01-15T10:00:00Z' },
  { hash: 'def789abc012', message: 'Add feature', author: 'Jane Smith', date: '2024-01-16T14:30:00Z' },
];

describe('GitHistoryView', () => {
  it('renders commit entries', async () => {
    (window as any).jarvis = { gitLog: vi.fn().mockResolvedValue(mockLog) };
    render(<GitHistoryView repoPath="/test" />);
    expect(await screen.findByText('Initial commit')).toBeInTheDocument();
    expect(screen.getByText('Add feature')).toBeInTheDocument();
  });

  it('renders author names', async () => {
    (window as any).jarvis = { gitLog: vi.fn().mockResolvedValue(mockLog) };
    render(<GitHistoryView repoPath="/test" />);
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
