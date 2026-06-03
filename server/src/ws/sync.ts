import { query, queryOne } from '../db/connection.js';

interface NoteUpdate {
  noteId: string;
  title?: string;
  content?: string;
  version: number;
  userId: string;
}

interface SyncResult {
  accepted: boolean;
  currentVersion: number;
  diff?: { title?: string; content?: string };
}

export async function resolveNoteUpdate(update: NoteUpdate): Promise<SyncResult> {
  const note = await queryOne<{ id: string; version: number; title: string; content: string }>(
    'SELECT id, version, title, content FROM shared_notes WHERE id = $1 AND NOT is_deleted',
    [update.noteId]
  );

  if (!note) {
    return { accepted: false, currentVersion: 0 };
  }

  if (update.version < note.version) {
    return {
      accepted: false,
      currentVersion: note.version,
      diff: {
        title: note.title,
        content: note.content,
      },
    };
  }

  // LWW: apply the update
  const finalTitle = update.title ?? note.title;
  const finalContent = update.content ?? note.content;

  await queryOne(
    `UPDATE shared_notes
     SET title = $1, content = $2, version = version + 1, updated_by = $3, updated_at = NOW()
     WHERE id = $4`,
    [finalTitle, finalContent, update.userId, update.noteId]
  );

  return { accepted: true, currentVersion: note.version + 1 };
}

export async function getNoteHistory(noteId: string, limit = 10) {
  return await query(
    `SELECT id, note_id, user_id, title, content, operation, applied_at
     FROM note_history
     WHERE note_id = $1
     ORDER BY applied_at DESC
     LIMIT $2`,
    [noteId, limit]
  );
}
