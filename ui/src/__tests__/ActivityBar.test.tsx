import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityBar } from '@/components/ActivityBar';

describe('ActivityBar', () => {
  it('renders all navigation items by title', () => {
    render(<ActivityBar activeView="ide" onViewChange={vi.fn()} />);

    expect(screen.getByTitle('Assistente IA')).toBeInTheDocument();
    expect(screen.getByTitle('Conhecimento')).toBeInTheDocument();
    expect(screen.getByTitle('Workspace')).toBeInTheDocument();
    expect(screen.getByTitle('Automação')).toBeInTheDocument();
    expect(screen.getByTitle('Configurações')).toBeInTheDocument();
  });

  it('calls onViewChange when clicking an item', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();

    render(<ActivityBar activeView="ide" onViewChange={onViewChange} />);

    await user.click(screen.getByTitle('Assistente IA'));
    expect(onViewChange).toHaveBeenCalledWith('ai');
  });

  it('highlights the active view with bg class', () => {
    render(<ActivityBar activeView="ai" onViewChange={vi.fn()} />);

    const activeButton = screen.getByTitle('Assistente IA');
    expect(activeButton.className).toContain('bg-sidebar-active');
  });
});
