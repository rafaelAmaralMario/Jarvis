import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  const filteredCommands = [
    { id: 'save-file', label: 'Salvar arquivo atual' },
    { id: 'search', label: 'Buscar no projeto' },
  ];

  const defaultProps = {
    paletteOpen: true,
    paletteQuery: '',
    filteredCommands,
    onPaletteQueryChange: vi.fn(),
    onPaletteClose: vi.fn(),
    onRunCommand: vi.fn(),
  };

  it('should render null when closed', () => {
    const { container } = render(<CommandPalette {...defaultProps} paletteOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render input when open', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByPlaceholderText('Digite um comando...')).toBeInTheDocument();
  });

  it('should render filtered commands', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText('Salvar arquivo atual')).toBeInTheDocument();
    expect(screen.getByText('Buscar no projeto')).toBeInTheDocument();
  });

  it('should render empty list when no commands match', () => {
    render(<CommandPalette {...defaultProps} filteredCommands={[]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
