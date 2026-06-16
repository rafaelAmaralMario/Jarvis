import { useState, useEffect, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface ProblemEntry {
  file: string;
  line: number;
  column: number;
  severity: string;
  message: string;
  code: string;
}

export function ProblemsPanel() {
  const bridge = useJarvis();
  const [problems, setProblems] = useState<ProblemEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');

  const refresh = useCallback(async () => {
    try {
      const severity = filter === 'all' ? '' : filter;
      const list = await bridge.problemsGet('', severity);
      setProblems(list as ProblemEntry[]);
    } catch { }
  }, [bridge, filter]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleClear = useCallback(() => {
    bridge.problemsClear();
    setProblems([]);
  }, [bridge]);

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '✕';
      case 'warn': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-[#ccc]';
    }
  };

  const errors = problems.filter(p => p.severity === 'error').length;
  const warnings = problems.filter(p => p.severity === 'warn' || p.severity === 'warning').length;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-xs font-mono">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#333] bg-[#252526] shrink-0">
        <span className="text-[#999]">Problems</span>
        {errors > 0 && <span className="text-red-400">{errors} error(s)</span>}
        {warnings > 0 && <span className="text-yellow-400">{warnings} warning(s)</span>}
        <div className="flex-1" />
        <div className="flex gap-0.5">
          {(['all', 'error', 'warn'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${filter === f ? 'bg-[#007acc] text-white' : 'text-[#999] hover:text-[#ccc]'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={handleClear} className="px-2 py-0.5 text-[#999] hover:text-[#ccc] rounded hover:bg-[#ffffff1a]">
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {problems.length === 0 && (
          <div className="text-[#666] italic p-4 text-center">No problems detected.</div>
        )}
        {problems.map((p, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-1 border-b border-[#2a2a2a] hover:bg-[#2a2a2a]">
            <span className={`mt-0.5 ${severityColor(p.severity)}`}>{severityIcon(p.severity)}</span>
            <span className="text-[#ccc] flex-1">{p.message}</span>
            <span className="text-[#555] shrink-0 text-[10px]">
              {p.file}:{p.line}:{p.column}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
