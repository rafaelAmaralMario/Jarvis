import { useState } from 'react';
import type { ActionLog } from '../../shared/types';

export function useLogs() {
  const [logs, setLogs] = useState<ActionLog[]>([]);

  function addLog(message: string, status: ActionLog['status'] = 'ok') {
    setLogs((current) => [
      { id: crypto.randomUUID(), message, status },
      ...current.slice(0, 24),
    ]);
  }

  return { logs, setLogs, addLog };
}
