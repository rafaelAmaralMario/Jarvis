import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/Knowledge/SearchBar';

const mockBridge = {
  searchNotes: vi.fn().mockResolvedValue([
    { id: 'r1', title: 'Result 1', snippet: 'some snippet', score: 0.95 },
  ]),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar onSelectNote={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument();
  });

  it('shows results on typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSelectNote={vi.fn()} />);
    const input = screen.getByPlaceholderText(/search notes/i);
    await user.type(input, 'test');
    expect(await screen.findByText('Result 1')).toBeInTheDocument();
  });
});
