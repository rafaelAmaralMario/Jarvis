import { useState, useEffect } from 'react';
import type { GitBranch } from '@/types';

interface GitBranchManagerProps {
  repoPath: string;
}

export function GitBranchManager({ repoPath }: GitBranchManagerProps) {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [newBranch, setNewBranch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const jarvis = (window as any).jarvis;
      if (!jarvis) return;
      const b = await jarvis.gitBranches(repoPath) as GitBranch[];
      setBranches(b);
    } catch (e) {
      console.error('git branches error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadBranches(); }, [repoPath]);

  const handleCheckout = async (name: string) => {
    const jarvis = (window as any).jarvis;
    if (!jarvis) return;
    await jarvis.gitCheckout(repoPath, name);
    loadBranches();
  };

  const handleCreate = async () => {
    if (!newBranch.trim()) return;
    const jarvis = (window as any).jarvis;
    if (!jarvis) return;
    await jarvis.gitCreateBranch(repoPath, newBranch.trim());
    setNewBranch('');
    loadBranches();
  };

  const handleDelete = async (name: string) => {
    const jarvis = (window as any).jarvis;
    if (!jarvis) return;
    await jarvis.gitDeleteBranch(repoPath, name);
    loadBranches();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-900/50">
        <span className="font-semibold text-sm">Branches</span>
        <div className="flex-1" />
        <button onClick={loadBranches} className="px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">
          {loading ? '↻' : '↻'}
        </button>
      </div>
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="flex gap-1">
          <input
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            placeholder="New branch name..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!newBranch.trim()}
            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs"
          >
            Create
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {branches.map((b) => (
          <div
            key={b.name}
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 cursor-pointer text-sm ${
              b.isCurrent ? 'bg-blue-900/20 text-blue-400' : ''
            }`}
            onClick={() => !b.isCurrent && handleCheckout(b.name)}
          >
            <span className="w-4">{b.isCurrent ? '✔' : '○'}</span>
            <span className="flex-1 truncate">{b.name}</span>
            {!b.isCurrent && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(b.name); }}
                className="text-zinc-500 hover:text-red-400 text-xs opacity-0 hover:opacity-100 transition-opacity"
                title="Delete branch"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
