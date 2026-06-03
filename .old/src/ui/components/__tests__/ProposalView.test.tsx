import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProposalView } from '../ProposalView';

describe('ProposalView', () => {
  it('should render empty proposal state', () => {
    render(<ProposalView diff="" proposalAccepted={false} onAcceptProposal={vi.fn()} />);
    expect(screen.getByText(/Nenhuma proposta gerada/i)).toBeInTheDocument();
  });

  it('should render diff content', () => {
    render(<ProposalView diff="diff --git a/file.ts b/file.ts" proposalAccepted={false} onAcceptProposal={vi.fn()} />);
    expect(screen.getByText(/diff --git a\/file.ts b\/file.ts/)).toBeInTheDocument();
  });

  it('should show accepted message when accepted', () => {
    render(<ProposalView diff="" proposalAccepted={true} onAcceptProposal={vi.fn()} />);
    expect(screen.getByText(/Proposta aceita/i)).toBeInTheDocument();
  });

  it('should not show accepted message when not accepted', () => {
    render(<ProposalView diff="" proposalAccepted={false} onAcceptProposal={vi.fn()} />);
    expect(screen.queryByText(/Proposta aceita/i)).not.toBeInTheDocument();
  });
});
