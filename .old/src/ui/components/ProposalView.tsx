import { CheckCircle2 } from 'lucide-react';

interface ProposalViewProps {
  diff: string;
  proposalAccepted: boolean;
  onAcceptProposal: () => void;
}

export function ProposalView({ diff, proposalAccepted, onAcceptProposal }: ProposalViewProps) {
  return (
    <div className="proposal">
      <strong>Proposta de alteracao</strong>
      <pre className="proposal-diff">{diff || 'Nenhuma proposta gerada.'}</pre>
      <button className="primary-button" onClick={onAcceptProposal} type="button">
        <CheckCircle2 size={15} />
        Aceitar proposta
      </button>
      {proposalAccepted && <span className="accepted">Proposta aceita.</span>}
    </div>
  );
}
