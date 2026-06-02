import type { AuditEvent } from '../../shared/types';

interface AuditViewProps {
  auditEvents: AuditEvent[];
}

export function AuditView({ auditEvents }: AuditViewProps) {
  return (
    <div className="bottom-content">
      {auditEvents.map((event) => (
        <div className="audit-row" key={event.id}>
          <strong>{event.actor}</strong>
          <span>{event.timestamp}</span>
          <small>{event.permission} | {event.target} | {event.result}</small>
        </div>
      ))}
    </div>
  );
}
