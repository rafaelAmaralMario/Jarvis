import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '@/components/Editor/CommandPalette';

const commands = [
  { id: 'save', label: 'Save file', shortcut: 'Ctrl+S', category: 'file' as const, action: vi.fn() },
  { id: 'open', label: 'Open file', shortcut: 'Ctrl+O', category: 'file' as const, action: vi.fn() },
];

describe('CommandPalette', () => {
  it('renders when open', () => {
    render(<CommandPalette isOpen onClose={vi.fn()} commands={commands} />);
    expect(screen.getByPlaceholderText(/comando/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<CommandPalette isOpen={false} onClose={vi.fn()} commands={commands} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls action on command click', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<CommandPalette isOpen onClose={vi.fn()} commands={[{ ...commands[0], action }]} />);
    await user.click(screen.getByText('Save file'));
    expect(action).toHaveBeenCalled();
  });
});
