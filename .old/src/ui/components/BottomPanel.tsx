import type { BottomView } from '../types';
import { bottomLabels } from '../constants';
import { LogsView } from './LogsView';
import { ProposalView } from './ProposalView';
import { AuditView } from './AuditView';
import type { ActionLog, AuditEvent } from '../../shared/types';

interface BottomPanelProps {
  bottomView: BottomView;
  diff: string;
  selectedGitFile: string;
  logs: ActionLog[];
  auditEvents: AuditEvent[];
  proposalAccepted: boolean;
  onBottomViewChange: (view: BottomView) => void;
  onAcceptProposal: () => void;
}

export function BottomPanel({
  bottomView,
  diff,
  selectedGitFile,
  logs,
  auditEvents,
  proposalAccepted,
  onBottomViewChange,
  onAcceptProposal,
}: BottomPanelProps) {
  return (
    <section className="bottom-panel">
      <nav>
        {(['logs', 'diff', 'proposal', 'audit', 'terminal'] as BottomView[]).map((view) => (
          <button
            className={bottomView === view ? 'bottom-tab active' : 'bottom-tab'}
            key={view}
            onClick={() => onBottomViewChange(view)}
            type="button"
          >
            {bottomLabels[view]}
          </button>
        ))}
      </nav>
      {bottomView === 'logs' && <LogsView logs={logs} />}
      {bottomView === 'diff' && <pre className="diff-view">{diff || selectedGitFile}</pre>}
      {bottomView === 'proposal' && (
        <ProposalView diff={diff} proposalAccepted={proposalAccepted} onAcceptProposal={onAcceptProposal} />
      )}
      {bottomView === 'audit' && <AuditView auditEvents={auditEvents} />}
      {bottomView === 'terminal' && <pre className="terminal-view">npm run tauri -- dev</pre>}
    </section>
  );
}
