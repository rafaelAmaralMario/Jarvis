import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { MCPServerInfo, MCPServerInput } from '@/types';

const TRANSPORT_ICONS: Record<string, string> = { stdio: '💻', sse: '🌐', websocket: '🔗' };

export function MCPServersPanel() {
  const bridge = useJarvis();
  const [servers, setServers] = useState<MCPServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', transport: 'stdio', command: '', url: '', args: '', env: '' });

  useEffect(() => { loadServers(); }, []);

  async function loadServers() {
    setLoading(true);
    try { setServers(await bridge.mcpListServers()); } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate() {
    const data: MCPServerInput = { name: formData.name, transport: formData.transport };
    if (formData.transport === 'stdio') data.command = formData.command;
    else data.url = formData.url;
    if (formData.args) data.args = formData.args.split(' ').filter(Boolean);
    await bridge.mcpCreateServer(data);
    setShowForm(false);
    setFormData({ name: '', transport: 'stdio', command: '', url: '', args: '', env: '' });
    loadServers();
  }

  async function handleToggle(id: string, running: boolean) {
    if (running) await bridge.mcpStopServer(id);
    else await bridge.mcpStartServer(id);
    loadServers();
  }

  async function handleDelete(id: string) {
    await bridge.mcpDeleteServer(id);
    loadServers();
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading MCP servers...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">MCP Servers</h2>
          <p className="text-sm text-muted-foreground">Model Context Protocol tool servers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          + Add Server
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 rounded-xl border border-border bg-card space-y-2">
            <input placeholder="Server name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={formData.transport} onChange={e => setFormData(f => ({ ...f, transport: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none">
              <option value="stdio">STDIO</option>
              <option value="sse">SSE</option>
              <option value="websocket">WebSocket</option>
            </select>
            {formData.transport === 'stdio' ? (
              <>
                <input placeholder="Command (e.g. npx, uvx)" value={formData.command} onChange={e => setFormData(f => ({ ...f, command: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Args (space-separated)" value={formData.args} onChange={e => setFormData(f => ({ ...f, args: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none" />
              </>
            ) : (
              <input placeholder="URL" value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))} className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            )}
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Create</button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-2">
        {servers.map(s => (
          <motion.div key={s.id} layout className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <span className="text-lg">{TRANSPORT_ICONS[s.transport] || '🔌'}</span>
              <div>
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-[10px] text-muted-foreground">{s.transport} · {s.command || s.url}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${s.running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <button onClick={() => handleToggle(s.id, s.running)} className={`px-2 py-1 text-xs rounded-md border ${s.running ? 'border-red-500/50 text-red-400' : 'border-green-500/50 text-green-400'} hover:bg-accent`}>
                {s.running ? 'Stop' : 'Start'}
              </button>
              <button onClick={() => handleDelete(s.id)} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-red-950/20 hover:text-red-400">Delete</button>
            </div>
          </motion.div>
        ))}
        {servers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-2xl mb-2">🔌</p>
            <p className="text-sm">No MCP servers configured</p>
            <p className="text-xs">Add a server to expose tools to your AI agents</p>
          </div>
        )}
      </div>
    </div>
  );
}
