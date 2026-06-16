import { useState, useEffect, useRef, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface LogEntry {
  timestamp: number;
  level: string;
  source: string;
  message: string;
}

export function OutputPanel() {
  const bridge = useJarvis();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bridge.outputGetLogs().then(setLogs).catch(() => {});
    const interval = setInterval(() => {
      bridge.outputGetLogs(filter || undefined).then(setLogs).catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [bridge, filter]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClear = useCallback(async () => {
    await bridge.outputClearLogs();
    setLogs([]);
  }, [bridge]);

  const levelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-[#ccc]';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-xs font-mono">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#333] bg-[#252526] shrink-0">
        <span className="text-[#999]">Output</span>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="ml-2 bg-[#3c3c3c] text-[#ccc] border border-[#555] rounded px-1.5 py-0.5 text-xs"
        >
          <option value="">All Sources</option>
          {[...new Set(logs.map(l => l.source))].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button onClick={handleClear} className="px-2 py-0.5 text-[#999] hover:text-[#ccc] rounded hover:bg-[#ffffff1a]">
          Clear
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {logs.length === 0 && (
          <div className="text-[#666] italic p-2">No output yet...</div>
        )}
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[#666] shrink-0 w-[80px]">
              {new Date(entry.timestamp * 1000).toLocaleTimeString()}
            </span>
            <span className={`shrink-0 w-[50px] uppercase ${levelColor(entry.level)}`}>
              [{entry.level}]
            </span>
            <span className="text-[#888] shrink-0">{entry.source}:</span>
            <span className="text-[#ccc] break-all">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
