import { query, queryOne } from '../db/connection.js';

export interface SyncPayload {
  notes: Array<{
    id: string;
    title: string;
    content: string;
    version: number;
    updatedAt: string;
  }>;
  lastSync: string;
}

export async function pullNotes(workspaceId: string, since: string): Promise<SyncPayload> {
  const notes = await query(
    `SELECT id, title, content, version, updated_at
     FROM shared_notes
     WHERE workspace_id = $1 AND updated_at > $2 AND NOT is_deleted
     ORDER BY updated_at ASC`,
    [workspaceId, since]
  );

  return {
    notes: notes.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      version: n.version,
      updatedAt: n.updated_at,
    })),
    lastSync: new Date().toISOString(),
  };
}

export async function pushNotes(workspaceId: string, userId: string, notes: SyncPayload['notes']): Promise<{
  accepted: number;
  conflicts: Array<{ id: string; serverVersion: number }>;
}> {
  let accepted = 0;
  const conflicts: Array<{ id: string; serverVersion: number }> = [];

  for (const note of notes) {
    const existing = await queryOne<{ id: string; version: number }>(
      'SELECT id, version FROM shared_notes WHERE id = $1 AND NOT is_deleted',
      [note.id]
    );

    if (!existing) {
      // New note
      await query(
        `INSERT INTO shared_notes (id, workspace_id, title, content, version, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [note.id, workspaceId, note.title, note.content, note.version, userId, userId]
      );
      accepted++;
    } else if (existing.version === note.version) {
      // No conflict
      await query(
        `UPDATE shared_notes SET title = $1, content = $2, version = version + 1, updated_by = $3, updated_at = NOW()
         WHERE id = $4 AND version = $5`,
        [note.title, note.content, userId, note.id, note.version]
      );
      accepted++;
    } else {
      conflicts.push({ id: note.id, serverVersion: existing.version });
    }
  }

  return { accepted, conflicts };
}
