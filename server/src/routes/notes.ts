import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/connection.js';
import { broadcastToWorkspace } from '../ws/handler.js';

const router = Router();

const createNoteSchema = z.object({
  title: z.string().min(1).default('Untitled'),
  content: z.string().default(''),
  workspaceId: z.string().uuid(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  version: z.number().int().positive(),
});

router.get('/', async (req: Request, res: Response) => {
  const workspaceId = req.query.workspace as string;
  if (!workspaceId) {
    res.status(400).json({ error: 'workspace query parameter required' });
    return;
  }

  const notes = await query(
    `SELECT id, workspace_id, title, content, content_plain, tags, version,
            created_by, updated_by, created_at, updated_at
     FROM shared_notes
     WHERE workspace_id = $1 AND NOT is_deleted
     ORDER BY updated_at DESC`,
    [workspaceId]
  );

  res.json(notes);
});

router.get('/:id', async (req: Request, res: Response) => {
  const note = await queryOne(
    'SELECT * FROM shared_notes WHERE id = $1 AND NOT is_deleted',
    [req.params.id]
  );

  if (!note) {
    res.status(404).json({ error: 'Nota não encontrada' });
    return;
  }

  res.json(note);
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { title, content, workspaceId } = parsed.data;
  const userId = req.user!.userId;

  const note = await queryOne(
    `INSERT INTO shared_notes (workspace_id, title, content, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [workspaceId, title, content, userId, userId]
  );

  if (note) {
    await query(
      `INSERT INTO note_history (note_id, user_id, title, content, content_plain, operation)
       VALUES ($1, $2, $3, $4, $5, 'create')`,
      [note.id, userId, title, content, content]
    );
  }

  res.status(201).json(note);
});

router.put('/:id', async (req: Request, res: Response) => {
  const parsed = updateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { title, content, version } = parsed.data;
  const userId = req.user!.userId;

  // Version conflict check
  const existing = await queryOne<{ id: string; version: number; workspace_id: string; title: string; content: string }>(
    'SELECT id, version, workspace_id, title, content FROM shared_notes WHERE id = $1 AND NOT is_deleted',
    [req.params.id]
  );

  if (!existing) {
    res.status(404).json({ error: 'Nota não encontrada' });
    return;
  }

  if (existing.version !== version) {
    res.status(409).json({
      error: 'Conflito de versão',
      currentVersion: existing.version,
    });
    return;
  }

  const newTitle = title ?? existing.title;
  const newContent = content ?? existing.content;

  const updated = await queryOne(
    `UPDATE shared_notes
     SET title = $1, content = $2, version = version + 1, updated_by = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [newTitle, newContent, userId, req.params.id]
  );

  if (updated) {
    await query(
      `INSERT INTO note_history (note_id, user_id, title, content, content_plain, operation)
       VALUES ($1, $2, $3, $4, $5, 'update')`,
      [updated.id, userId, newTitle, newContent, newContent]
    );

    // Broadcast via WebSocket
    broadcastToWorkspace(existing.workspace_id, {
      type: 'note:updated',
      noteId: updated.id,
      title: newTitle,
      content: newContent,
      version: updated.version,
      updatedBy: userId,
    });
  }

  res.json(updated);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const existing = await queryOne<{ id: string; workspace_id: string; title: string; content: string }>(
    'SELECT id, workspace_id, title, content FROM shared_notes WHERE id = $1 AND NOT is_deleted',
    [req.params.id]
  );

  if (!existing) {
    res.status(404).json({ error: 'Nota não encontrada' });
    return;
  }

  // Soft delete
  await query(
    'UPDATE shared_notes SET is_deleted = TRUE, updated_by = $1, updated_at = NOW() WHERE id = $2',
    [userId, req.params.id]
  );

  await query(
    `INSERT INTO note_history (note_id, user_id, title, content, content_plain, operation)
     VALUES ($1, $2, $3, $4, $5, 'delete')`,
    [req.params.id, userId, existing.title, existing.content, existing.content]
  );

  broadcastToWorkspace(existing.workspace_id, {
    type: 'note:deleted',
    noteId: req.params.id,
  });

  res.status(204).send();
});

export default router;
