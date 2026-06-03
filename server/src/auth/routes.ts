import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db/connection.js';
import { signToken } from './jwt.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  displayName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { email, password, displayName } = parsed.data;

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing) {
    res.status(409).json({ error: 'Email já cadastrado' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await queryOne<{ id: string; email: string; display_name: string }>(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name`,
    [email, passwordHash, displayName]
  );

  if (!user) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
    return;
  }

  const token = signToken({ userId: user.id });
  res.status(201).json({
    user: { id: user.id, email: user.email, displayName: user.display_name },
    token,
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await queryOne<{ id: string; email: string; display_name: string; password_hash: string }>(
    'SELECT id, email, display_name, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = signToken({ userId: user.id });
  res.json({
    user: { id: user.id, email: user.email, displayName: user.display_name },
    token,
  });
});

export default router;
