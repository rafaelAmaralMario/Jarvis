import { useState } from 'react';

interface GitCommitBoxProps {
  repoPath: string;
  hasChanges: boolean;
  onCommit: () => void;
}

export function GitCommitBox({ repoPath, hasChanges, onCommit }: GitCommitBoxProps) {
  const [message, setMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');

  const handleCommit = async (push = false) => {
    if (!message.trim()) return;
    setCommitting(true);
    setError('');
    try {
      const jarvis = (window as any).jarvis;
      if (!jarvis) return;
      const ok = await jarvis.gitCommit(repoPath, message.trim());
      if (!ok) {
        setError('Nothing to commit or commit failed');
        setCommitting(false);
        return;
      }
      if (push) {
        await jarvis.gitPush(repoPath);
      }
      setMessage('');
      onCommit();
    } catch (e: any) {
      setError(e.message || 'Commit failed');
    }
    setCommitting(false);
  };

  return (
    <div className="border-t border-zinc-700 p-3 bg-zinc-900/50">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Commit message..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs resize-none h-20 focus:outline-none focus:border-blue-500"
        disabled={committing}
      />
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handleCommit(false)}
          disabled={!message.trim() || committing || !hasChanges}
          className="flex-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
        >
          {committing ? 'Committing...' : 'Commit'}
        </button>
        <button
          onClick={() => handleCommit(true)}
          disabled={!message.trim() || committing || !hasChanges}
          className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
          title="Commit & Push"
        >
          ↑ Push
        </button>
      </div>
    </div>
  );
}
