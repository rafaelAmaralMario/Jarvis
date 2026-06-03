import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalDialog } from '../ModalDialog';

describe('ModalDialog', () => {
  const defaultProps = {
    modal: { type: 'create-file', title: 'Criar arquivo' } as const,
    modalValue: '',
    onSubmitModal: vi.fn(),
    onCloseModal: vi.fn(),
    onModalValueChange: vi.fn(),
  };

  it('should render null when modal is null', () => {
    const { container } = render(
      <ModalDialog {...defaultProps} modal={null} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render modal title', () => {
    render(<ModalDialog {...defaultProps} />);
    expect(screen.getByText('Criar arquivo')).toBeInTheDocument();
  });

  it('should render input for create-file', () => {
    render(<ModalDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText('Nome')).toBeInTheDocument();
  });

  it('should render confirmation for delete', () => {
    render(
      <ModalDialog
        {...defaultProps}
        modal={{ type: 'delete', title: 'Remover item', entry: { name: 'test.ts', path: '/test.ts', kind: 'file' as const, children: [] } }}
      />,
    );
    expect(screen.getByText(/Esta acao e sensivel/i)).toBeInTheDocument();
  });

  it('should render confirmation for switch-workspace', () => {
    render(
      <ModalDialog
        {...defaultProps}
        modal={{ type: 'switch-workspace', title: 'Trocar workspace' }}
      />,
    );
    expect(screen.getByText(/Esta acao e sensivel/i)).toBeInTheDocument();
  });

  it('should call onCloseModal on overlay click', async () => {
    const onCloseModal = vi.fn();
    render(<ModalDialog {...defaultProps} onCloseModal={onCloseModal} />);
    const overlay = screen.getByText('Criar arquivo').closest('.overlay')!;
    await userEvent.click(overlay);
    expect(onCloseModal).toHaveBeenCalled();
  });

  it('should render cancel and confirm buttons', () => {
    render(<ModalDialog {...defaultProps} />);
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });
});
