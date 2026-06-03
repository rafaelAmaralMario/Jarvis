import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  const ref = { current: null };
  const defaultProps = {
    messages: [] as Array<{ role: 'user' | 'assistant'; content: string }>,
    chatInput: '',
    generationActive: false,
    chatMessagesRef: ref,
    onChatInputChange: vi.fn(),
    onSendMessage: vi.fn(),
    onCancelGeneration: vi.fn(),
  };

  it('should render empty state', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByText(/Envie uma mensagem/i)).toBeInTheDocument();
  });

  it('should render messages', () => {
    render(<ChatPanel {...defaultProps} messages={[
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('should show cancel button when generating', () => {
    render(<ChatPanel {...defaultProps} generationActive={true} />);
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('should show send button when not generating', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });
});
