import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomPanel } from '../BottomPanel';

describe('BottomPanel', () => {
  const defaultProps = {
    bottomView: 'logs' as const,
    diff: '',
    selectedGitFile: '',
    logs: [] as Array<{ id: string; message: string; status: 'ok' | 'warn' }>,
    auditEvents: [] as Array<{ id: string; timestamp: string; actor: string; permission: string; target: string; result: string }>,
    proposalAccepted: false,
    onBottomViewChange: vi.fn(),
    onAcceptProposal: vi.fn(),
  };

  it('should render all tab labels', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Diff')).toBeInTheDocument();
    expect(screen.getByText('Proposta')).toBeInTheDocument();
    expect(screen.getByText('Auditoria')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
  });

  it('should render logs view by default', () => {
    render(<BottomPanel {...defaultProps} />);
    expect(screen.getByText('Logs').closest('button')?.classList.contains('active')).toBe(true);
  });

  it('should render diff view', () => {
    render(<BottomPanel {...defaultProps} bottomView="diff" diff="diff content" />);
    expect(screen.getByText('diff content')).toBeInTheDocument();
  });

  it('should render proposal view', () => {
    render(<BottomPanel {...defaultProps} bottomView="proposal" />);
    expect(screen.getByText(/Proposta de alteracao/i)).toBeInTheDocument();
  });

  it('should render terminal view', () => {
    render(<BottomPanel {...defaultProps} bottomView="terminal" />);
    expect(screen.getByText(/npm run tauri/i)).toBeInTheDocument();
  });

  it('should render audit view with events', () => {
    const events = [
      { id: '1', timestamp: '2024-01-01', actor: 'user', permission: 'git.commit', target: 'workspace', result: 'success' },
    ];
    render(<BottomPanel {...defaultProps} bottomView="audit" auditEvents={events} />);
    expect(screen.getByText('user')).toBeInTheDocument();
  });
});
