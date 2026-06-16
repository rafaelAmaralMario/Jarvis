import { useState, useEffect, useCallback } from 'react';
import { useJarvis } from '@/hooks/use-jarvis';

interface MCPEntry {
  id: string;
  name: string;
  transport: string;
  command: string;
  url: string;
  enabled: boolean;
  running: boolean;
}

export function MCPBottomPanel() {
  const bridge = useJarvis();
  const [servers, setServers] = useState<MCPEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await bridge.mcpListServers();
      setServers(list as MCPEntry[]);
    } catch { }
    setLoading(false);
  }, [bridge]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStart = useCallback(async (id: string) => {
    await bridge.mcpStartServer(id);
    refresh();
  }, [bridge, refresh]);

  const handleStop = useCallback(async (id: string) => {
    await bridge.mcpStopServer(id);
    refresh();
  }, [bridge, refresh]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-[#666] text-xs">
        Loading MCP servers...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-xs font-mono">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-[#333] bg-[#252526] shrink-0">
        <span className="text-[#999]">MCP Servers</span>
        <span className="text-[#666]">({servers.length})</span>
        <div className="flex-1" />
        <button onClick={refresh} className="px-2 py-0.5 text-[#999] hover:text-[#ccc] rounded hover:bg-[#ffffff1a]">
          Refresh
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {servers.length === 0 && (
          <div className="text-[#666] italic p-4 text-center">No MCP servers configured. Add them in Settings → MCP Servers.</div>
        )}
        {servers.map(server => (
          <div key={server.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-[#2a2a2a] hover:bg-[#2a2a2a]">
            <span className={`w-2 h-2 rounded-full ${server.running ? 'bg-green-400' : 'bg-gray-500'}`} />
            <span className="text-[#ccc]">{server.name}</span>
            <span className="text-[#666]">({server.transport})</span>
            <span className="text-[#555] text-[10px] truncate max-w-[200px]">
              {server.transport === 'stdio' ? server.command : server.url}
            </span>
            <div className="flex-1" />
            {server.running ? (
              <button
                onClick={() => handleStop(server.id)}
                className="px-2 py-0.5 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={() => handleStart(server.id)}
                className="px-2 py-0.5 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50"
              >
                Start
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
