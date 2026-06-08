import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { WorkflowSummary, WorkflowDetail } from '@/types';

export function WorkflowsPanel() {
  const bridge = useJarvis();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWf, setSelectedWf] = useState<WorkflowDetail | null>(null);
  const [execResult, setExecResult] = useState<string | null>(null);

  useEffect(() => { loadWorkflows(); }, []);

  async function loadWorkflows() {
    setLoading(true);
    try { setWorkflows(await bridge.workflowList()); } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSelect(id: string) {
    const wf = await bridge.workflowGet(id);
    setSelectedWf(wf);
  }

  async function handleExecute(id: string) {
    setExecResult('Executing...');
    const result = await bridge.workflowExecute(id);
    setExecResult(JSON.stringify(result, null, 2));
    setTimeout(() => setExecResult(null), 8000);
    loadWorkflows();
  }

  async function handleDelete(id: string) {
    await bridge.workflowDelete(id);
    if (selectedWf?.id === id) setSelectedWf(null);
    loadWorkflows();
  }

  const triggerIcons: Record<string, string> = { manual: '👆', schedule: '⏰', event: '🔔', webhook: '🌐' };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading workflows...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Workflows</h2>
          <p className="text-sm text-muted-foreground">Automation workflows with step-based execution</p>
        </div>
        <button onClick={loadWorkflows} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent">Refresh</button>
      </div>

      <div className="grid gap-2">
        {workflows.map(w => (
          <motion.div key={w.id} layout className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{triggerIcons[w.triggerType] || '⚡'}</span>
                <div>
                  <div className="font-medium text-sm">{w.name}</div>
                  <div className="text-[10px] text-muted-foreground">{w.description || `${w.stepCount} steps · ${w.triggerType}`}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${w.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                <button onClick={() => handleSelect(w.id)} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-accent">View</button>
                <button onClick={() => handleExecute(w.id)} className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Run</button>
                <button onClick={() => handleDelete(w.id)} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-red-950/20 hover:text-red-400">Delete</button>
              </div>
            </div>
          </motion.div>
        ))}
        {workflows.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-2xl mb-2">⚡</p>
            <p className="text-sm">No workflows yet</p>
            <p className="text-xs">Create workflows via the API to automate tasks</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedWf && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm mb-2">{selectedWf.name} — Steps</h3>
            <div className="space-y-1.5">
              {selectedWf.steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="font-medium">{step.name}</span>
                  <span className="text-muted-foreground">({step.type})</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedWf(null)} className="mt-2 px-2 py-1 text-xs rounded-md border border-border hover:bg-accent">Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {execResult && (
        <div className="p-3 rounded-lg bg-blue-950/20 text-blue-400 border border-blue-900/40 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {execResult}
        </div>
      )}
    </div>
  );
}
