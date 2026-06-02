import { RefreshCw } from 'lucide-react';
import type { GitFileStatus, GitBranch } from '../../infrastructure/native';

interface GitPanelProps {
  gitFiles: GitFileStatus[];
  gitBranches: GitBranch[];
  commitMessage: string;
  branchName: string;
  prUrl: string;
  onRefreshWorkspace: () => void;
  onCommitMessageChange: (value: string) => void;
  onBranchNameChange: (value: string) => void;
  onSuggestCommitMessage: () => void;
  onCreateCommit: () => void;
  onCreateBranch: () => void;
  onCheckoutBranch: (branch: string) => void;
  onCreatePullRequestUrl: () => void;
  onOpenDiff: (filePath: string) => void;
  onStageFile: (filePath: string) => void;
  onUnstageFile: (filePath: string) => void;
}

export function GitPanel({
  gitFiles,
  gitBranches,
  commitMessage,
  branchName,
  prUrl,
  onRefreshWorkspace,
  onCommitMessageChange,
  onBranchNameChange,
  onSuggestCommitMessage,
  onCreateCommit,
  onCreateBranch,
  onCheckoutBranch,
  onCreatePullRequestUrl,
  onOpenDiff,
  onStageFile,
  onUnstageFile,
}: GitPanelProps) {
  return (
    <div className="panel-list">
      <button className="text-button with-icon" onClick={() => void onRefreshWorkspace()} type="button">
        <RefreshCw size={15} />
        Atualizar status
      </button>
      <div className="git-tools">
        <label>
          Mensagem de commit
          <input
            value={commitMessage}
            onChange={(event) => onCommitMessageChange(event.target.value)}
            placeholder="feat: ..."
          />
        </label>
        <div className="split-actions">
          <button className="text-button" onClick={onSuggestCommitMessage} type="button">
            Sugerir
          </button>
          <button className="primary-button" onClick={() => void onCreateCommit()} type="button">
            Commit
          </button>
        </div>
        <label>
          Nova branch
          <input
            value={branchName}
            onChange={(event) => onBranchNameChange(event.target.value)}
            placeholder="feature/nome"
          />
        </label>
        <button className="text-button" onClick={() => void onCreateBranch()} type="button">
          Criar branch
        </button>
        <button className="text-button" onClick={() => void onCreatePullRequestUrl()} type="button">
          Gerar URL de PR
        </button>
        {prUrl && (
          <a className="external-link" href={prUrl} rel="noreferrer" target="_blank">
            Abrir Pull Request
          </a>
        )}
      </div>
      <div className="branch-list">
        {gitBranches.map((branch) => (
          <button
            className={branch.current ? 'branch-button active' : 'branch-button'}
            key={branch.name}
            onClick={() => void onCheckoutBranch(branch.name)}
            type="button"
          >
            {branch.name}
          </button>
        ))}
      </div>
      {gitFiles.length === 0 && <div className="empty-state">Nenhuma mudanca Git.</div>}
      {gitFiles.map((file) => (
        <div className="git-file-row" key={file.path}>
          <button
            className="list-row button-row"
            onClick={() => void onOpenDiff(file.path)}
            type="button"
          >
            <span className="status-pill">{file.status || '??'}</span>
            {file.path}
          </button>
          <div className="split-actions">
            <button className="text-button" onClick={() => void onStageFile(file.path)} type="button">
              Stage
            </button>
            <button className="text-button" onClick={() => void onUnstageFile(file.path)} type="button">
              Unstage
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
