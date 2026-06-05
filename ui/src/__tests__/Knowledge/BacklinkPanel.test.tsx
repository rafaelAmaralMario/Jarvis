import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BacklinkPanel } from '@/components/Knowledge/BacklinkPanel';

const mockBridge = {
  getBacklinks: vi.fn().mockResolvedValue([
    { noteId: 'bl-1', title: 'Related Note', context: 'some context here' },
  ]),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('BacklinkPanel', () => {
  it('renders backlinks header', () => {
    render(<BacklinkPanel noteId="note-1" />);
    expect(screen.getByText(/backlinks/i)).toBeInTheDocument();
  });

  it('renders backlinks list', async () => {
    render(<BacklinkPanel noteId="note-1" />);
    expect(await screen.findByText('Related Note')).toBeInTheDocument();
  });

  it('shows empty message when no noteId', () => {
    render(<BacklinkPanel noteId={null} />);
    expect(screen.getByText(/select a note to see backlinks/i)).toBeInTheDocument();
  });
});
