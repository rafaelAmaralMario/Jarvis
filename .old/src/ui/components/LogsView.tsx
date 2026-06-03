import type { ActionLog } from '../../shared/types';

interface LogsViewProps {
  logs: ActionLog[];
}

export function LogsView({ logs }: LogsViewProps) {
  return (
    <div className="bottom-content">
      {logs.map((log) => (
        <div className={`log-row ${log.status}`} key={log.id}>
          {log.message}
        </div>
      ))}
    </div>
  );
}
