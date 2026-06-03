import { useState } from 'react';
import type { AuditEvent } from '../../shared/types';

export function useAudit() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  function addAudit(actor: string, permission: string, target: string, result: string) {
    setAuditEvents((current) => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleString(),
        actor,
        permission,
        target,
        result,
      },
      ...current.slice(0, 79),
    ]);
  }

  return { auditEvents, setAuditEvents, addAudit };
}
