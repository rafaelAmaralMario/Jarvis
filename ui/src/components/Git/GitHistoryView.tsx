import { useState, useEffect } from 'react';
import type { GitLogEntry } from '@/types';

interface GitHistoryViewProps {
  repoPath: string;
}

export function GitHistoryView({ repoPath }: GitHistoryViewProps) {
  const [entries, setEntries] = useState<GitLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLog = async () => {
    setLoading(true);
    try {
      const jarvis = (window as any).jarvis;
      if (!jarvis) return;
      const log = await jarvis.gitLog(repoPath, 50) as GitLogEntry[];
      setEntries(log);
    } catch (e) {
      console.error('git log error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadLog(); }, [repoPath]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-900/50">
        <span className="font-semibold text-sm">History</span>
        <div className="flex-1" />
        <button onClick={loadLog} className="px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">
          {loading ? '↻' : '↻'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.map((e) => (
          <div key={e.hash} className="px-3 py-2 border-b border-zinc-800 hover:bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-0.5">
              <code className="text-[10px] text-blue-400 font-mono">{e.hash.substring(0, 8)}</code>
              <span className="text-zinc-500 text-[10px]">{e.date.substring(0, 10)}</span>
            </div>
            <div className="text-sm truncate">{e.message}</div>
            <div className="text-[10px] text-zinc-500">{e.author}</div>
          </div>
        ))}
        {entries.length === 0 && !loading && (
          <div className="px-3 py-4 text-zinc-500 italic text-center">No commits yet</div>
        )}
      </div>
    </div>
  );
}
