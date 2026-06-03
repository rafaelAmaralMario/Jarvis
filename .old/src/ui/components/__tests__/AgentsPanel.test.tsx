import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentsPanel } from '../AgentsPanel';

describe('AgentsPanel', () => {
  const mockAgent = {
    id: 'agent-1',
    name: 'Dev Agent',
    goal: 'Write tests',
    defaultModelCapability: 'text' as const,
    permissions: ['read-workspace'],
    output: 'docs' as const,
  };

  const defaultProps = {
    allAgents: [] as typeof mockAgent[],
    modelHealth: 'ok' as const,
    onOpenAgentDesigner: vi.fn(),
    onRunAgent: vi.fn(),
  };

  it('should render new agent button when model is ok', () => {
    render(<AgentsPanel {...defaultProps} />);
    const button = screen.getByText('Novo agente');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should disable new agent button when model health is not ok', () => {
    render(<AgentsPanel {...defaultProps} modelHealth="fail" />);
    expect(screen.getByText('Novo agente')).toBeDisabled();
  });

  it('should render agent cards', () => {
    render(<AgentsPanel {...defaultProps} allAgents={[mockAgent]} />);
    expect(screen.getByText(/Agente Dev Agent/)).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });

  it('should render execute button for each agent', () => {
    render(<AgentsPanel {...defaultProps} allAgents={[mockAgent]} />);
    expect(screen.getByText('Executar')).toBeInTheDocument();
  });
});
