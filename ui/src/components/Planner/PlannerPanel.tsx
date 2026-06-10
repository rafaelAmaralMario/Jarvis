import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { PlannerProgress, PlannerCheckpoint } from '@/types';

const POLL_INTERVAL = 500;
const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

type Phase = 'idle' | 'running' | 'done';

export function PlannerPanel() {
  const bridge = useJarvis();
  const [task, setTask] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<PlannerProgress | null>(null);
  const [checkpoints, setCheckpoints] = useState<PlannerCheckpoint[]>([]);
  const [error, setError] = useState('');
  const taskIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCheckpoints = useCallback(async () => {
    try {
      const list = await bridge.plannerListCheckpoints();
      setCheckpoints(list);
    } catch {}
  }, [bridge]);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function startPlan(resumePlanId?: string) {
    if (!task.trim() && !resumePlanId) return;
    setError('');
    setPhase('running');
    setProgress(null);
    stopPolling();

    try {
      const { taskId } = resumePlanId
        ? await bridge.plannerResumeCheckpoint(resumePlanId)
        : await bridge.plannerExecuteStream(task);
      taskIdRef.current = taskId;

      pollingRef.current = setInterval(async () => {
        try {
          const p = await bridge.plannerGetProgress(taskId);
          setProgress(p);
          if (p.done || p.cancelled) {
            stopPolling();
            setPhase('done');
            loadCheckpoints();
          }
        } catch {
          stopPolling();
          setError('Failed to get progress');
          setPhase('done');
        }
      }, POLL_INTERVAL);
    } catch (err) {
      setError(String(err));
      setPhase('idle');
    }
  }

  async function cancelPlan() {
    if (!taskIdRef.current) return;
    try {
      await bridge.plannerCancel(taskIdRef.current);
    } catch {}
    stopPolling();
    setPhase('done');
  }

  function reset() {
    stopPolling();
    taskIdRef.current = null;
    setProgress(null);
    setPhase('idle');
    setError('');
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            📋 Task Planner
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Decompose complex tasks into automated steps with verification.
          </p>
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && phase !== 'running') startPlan(); }}
            placeholder="Describe the task to plan..."
            disabled={phase === 'running'}
            className="flex-1 px-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40 disabled:opacity-50"
          />
          <button
            onClick={() => startPlan()}
            disabled={phase === 'running' || !task.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {phase === 'running' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '▶ Run'
            )}
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="rounded-xl border border-border bg-card p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Step {progress.current_step} of {progress.total_steps}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  progress.status === 'running' ? 'bg-blue-500/10 text-blue-500' :
                  progress.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                  progress.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {progress.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current_step / Math.max(progress.total_steps, 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {progress.current_goal || 'Initializing...'}
              </p>

              {phase === 'running' && (
                <button
                  onClick={cancelPlan}
                  className="px-4 py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-colors"
                >
                  ■ Cancel
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {progress && progress.results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="rounded-xl border border-border bg-card divide-y divide-border"
            >
              <div className="px-5 py-3 text-sm font-medium">Results</div>
              {progress.results.map((r, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <span className="mt-0.5">{r.success ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.goal}</p>
                    {r.output && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.output}</p>
                    )}
                    {r.error && (
                      <p className="text-xs text-destructive mt-0.5">{r.error}</p>
                    )}
                    {r.retries > 0 && (
                      <p className="text-xs text-muted-foreground/50 mt-0.5">retries: {r.retries}</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done Actions */}
        {phase === 'done' && (
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            New Plan
          </button>
        )}

        {/* Checkpoints */}
        <AnimatePresence>
          {checkpoints.length > 0 && phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="rounded-xl border border-border bg-card divide-y divide-border"
            >
              <div className="px-5 py-3 text-sm font-medium flex items-center justify-between">
                <span>📌 Saved Plans</span>
                <button
                  onClick={loadCheckpoints}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
              {checkpoints.map((cp) => (
                <div key={cp.plan_id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{cp.task}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cp.completed_steps}/{cp.total_steps} steps · {new Date(cp.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTask(cp.task);
                      startPlan(cp.plan_id);
                    }}
                    disabled={false}
                    className="ml-3 px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
