import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/connection.js';

const router = Router();

router.get('/me', async (req: Request, res: Response) => {
  const user = await queryOne(
    'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
    [req.user!.userId]
  );

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  res.json(user);
});

router.get('/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  const users = await query(
    `SELECT id, email, display_name, avatar_url
     FROM users
     WHERE display_name ILIKE $1 OR email ILIKE $1
     LIMIT 20`,
    [`%${q}%`]
  );

  res.json(users);
});

export default router;
