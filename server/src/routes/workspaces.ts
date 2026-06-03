import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/connection.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, slug, description } = parsed.data;
  const userId = req.user!.userId;

  const existing = await queryOne('SELECT id FROM workspaces WHERE slug = $1', [slug]);
  if (existing) {
    res.status(409).json({ error: 'Slug já em uso' });
    return;
  }

  const workspace = await queryOne(
    `INSERT INTO workspaces (name, slug, description, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, slug, description ?? '', userId]
  );

  if (workspace) {
    // Add owner as member
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [workspace.id, userId]
    );
  }

  res.status(201).json(workspace);
});

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const workspaces = await query(
    `SELECT w.* FROM workspaces w
     JOIN workspace_members m ON m.workspace_id = w.id
     WHERE m.user_id = $1
     ORDER BY w.name`,
    [userId]
  );
  res.json(workspaces);
});

router.get('/:id', async (req: Request, res: Response) => {
  const workspace = await queryOne(
    'SELECT * FROM workspaces WHERE id = $1',
    [req.params.id]
  );
  if (!workspace) {
    res.status(404).json({ error: 'Workspace não encontrado' });
    return;
  }
  res.json(workspace);
});

// Add member to workspace
router.post('/:id/members', async (req: Request, res: Response) => {
  const { userId: memberId, role } = req.body;
  if (!memberId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  const validRoles = ['admin', 'member', 'viewer'];
  const finalRole = validRoles.includes(role) ? role : 'member';

  await query(
    `INSERT INTO workspace_members (workspace_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = $3`,
    [req.params.id, memberId, finalRole]
  );

  res.status(201).json({ status: 'member added' });
});

export default router;
