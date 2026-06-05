import { useState, useEffect } from 'react';
import type { GitStatusEntry } from '@/types';

const STATUS_ICONS: Record<string, string> = {
  M: '📝',
  A: '➕',
  D: '❌',
  R: '🔀',
  '?': '❓',
};

interface GitStatusListProps {
  repoPath: string;
  onRefresh: () => void;
  onChangesDetected?: (hasChanges: boolean) => void;
}

export function GitStatusList({ repoPath, onRefresh, onChangesDetected }: GitStatusListProps) {
  const [files, setFiles] = useState<GitStatusEntry[]>([]);
  const [stagedFiles, setStagedFiles] = useState<GitStatusEntry[]>([]);
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const jarvis = (window as any).jarvis;
      if (!jarvis) return;
      const [status, currentBranch] = await Promise.all([
        jarvis.gitStatus(repoPath) as Promise<GitStatusEntry[]>,
        jarvis.gitCurrentBranch(repoPath) as Promise<string>,
      ]);
      setFiles(status.filter((f: GitStatusEntry) => !f.staged));
      setStagedFiles(status.filter((f: GitStatusEntry) => f.staged));
      setBranch(currentBranch);
      onChangesDetected?.(status.length > 0);
    } catch (e) {
      console.error('git status error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, [repoPath]);

  const handleStage = async (filePath: string) => {
    const jarvis = (window as any).jarvis;
    if (!jarvis) return;
    await jarvis.gitStage(repoPath, filePath);
    loadStatus();
    onRefresh();
  };

  const handleUnstage = async (filePath: string) => {
    const jarvis = (window as any).jarvis;
    if (!jarvis) return;
    await jarvis.gitUnstage(repoPath, filePath);
    loadStatus();
    onRefresh();
  };

  const handleStageAll = async () => {
    const jarvis = (window as any).jarvis;
    if (!jarvis) return;
    await jarvis.gitStageAll(repoPath);
    loadStatus();
    onRefresh();
  };

  const renderFile = (f: GitStatusEntry, staged: boolean) => (
    <div
      key={f.path + (staged ? '-staged' : '')}
      className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-800 rounded cursor-pointer text-sm group"
    >
      <span className="w-5 text-center text-xs">{STATUS_ICONS[f.status] || '•'}</span>
      <span className="flex-1 truncate">{f.path}</span>
      <button
        className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); staged ? handleUnstage(f.path) : handleStage(f.path); }}
      >
        {staged ? 'Unstage' : '+ Stage'}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full text-xs">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-900/50">
        <span className="font-semibold text-sm">Git</span>
        <span className="text-zinc-400">[{branch || '?'}]</span>
        <div className="flex-1" />
        <button onClick={loadStatus} className="px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">
          {loading ? '↻' : '↻'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-zinc-400 font-medium text-xs border-b border-zinc-800">
          Staged ({stagedFiles.length})
        </div>
        {stagedFiles.length === 0 && (
          <div className="px-3 py-2 text-zinc-500 italic">No staged changes</div>
        )}
        {stagedFiles.map(f => renderFile(f, true))}

        <div className="px-3 py-1.5 text-zinc-400 font-medium text-xs border-b border-zinc-800 flex items-center gap-2 mt-1">
          <span>Changes ({files.length})</span>
          {files.length > 0 && (
            <button
              onClick={handleStageAll}
              className="ml-auto px-1.5 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-xs"
            >
              Stage All
            </button>
          )}
        </div>
        {files.length === 0 && (
          <div className="px-3 py-2 text-zinc-500 italic">No changes</div>
        )}
        {files.map(f => renderFile(f, false))}
      </div>
    </div>
  );
}
