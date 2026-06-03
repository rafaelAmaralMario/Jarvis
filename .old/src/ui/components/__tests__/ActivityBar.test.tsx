import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityBar } from '../ActivityBar';

vi.mock('../../../assets/jarvis-icon.svg', () => ({ default: 'jarvis-icon.svg' }));

describe('ActivityBar', () => {
  it('should render all activity items', () => {
    render(<ActivityBar activeView="files" onActiveViewChange={vi.fn()} />);
    expect(screen.getByTitle('Arquivos')).toBeInTheDocument();
    expect(screen.getByTitle('Busca')).toBeInTheDocument();
    expect(screen.getByTitle('Git')).toBeInTheDocument();
    expect(screen.getByTitle('Configuracoes')).toBeInTheDocument();
    expect(screen.getByTitle('Plugins')).toBeInTheDocument();
    expect(screen.getByTitle('Contexto')).toBeInTheDocument();
    expect(screen.getByTitle('Agentes')).toBeInTheDocument();
    expect(screen.getByTitle('Ajuda')).toBeInTheDocument();
  });

  it('should highlight active view', () => {
    render(<ActivityBar activeView="files" onActiveViewChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const filesButton = buttons.find((btn) => btn.classList.contains('active'));
    expect(filesButton).toBeTruthy();
  });
});
