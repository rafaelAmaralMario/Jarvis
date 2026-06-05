import { useState } from 'react';
import { GitStatusList } from './GitStatusList';
import { GitCommitBox } from './GitCommitBox';
import { GitHistoryView } from './GitHistoryView';
import { GitBranchManager } from './GitBranchManager';

interface GitPanelProps {
  repoPath: string;
  onFilesChanged?: () => void;
}

type GitView = 'changes' | 'history' | 'branches';

export function GitPanel({ repoPath, onFilesChanged }: GitPanelProps) {
  const [view, setView] = useState<GitView>('changes');
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    onFilesChanged?.();
  };

  const handleCommit = () => {
    handleRefresh();
  };

  const tabs: { id: GitView; label: string; icon: string }[] = [
    { id: 'changes', label: 'Changes', icon: '📝' },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'branches', label: 'Branches', icon: '🌿' },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex border-b border-zinc-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              view === t.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {view === 'changes' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <GitStatusList key={refreshKey} repoPath={repoPath} onRefresh={handleRefresh} onChangesDetected={setHasChanges} />
          </div>
          <GitCommitBox repoPath={repoPath} hasChanges={hasChanges} onCommit={handleCommit} />
        </div>
      )}
      {view === 'history' && <GitHistoryView key={refreshKey} repoPath={repoPath} />}
      {view === 'branches' && <GitBranchManager key={refreshKey} repoPath={repoPath} />}
    </div>
  );
}
