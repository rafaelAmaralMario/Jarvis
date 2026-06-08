import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  WS_PORT: z.coerce.number().default(8081),
  DATABASE_URL: z.string().default('postgres://jarvis:jarvis-dev@localhost:5432/jarvis'),
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

describe('Server Configuration Schema', () => {
  it('applies defaults when env is empty', () => {
    const cfg = envSchema.parse({});
    expect(cfg.PORT).toBe(8080);
    expect(cfg.WS_PORT).toBe(8081);
    expect(cfg.NODE_ENV).toBe('development');
    expect(cfg.DATABASE_URL).toContain('postgres://');
  });

  it('accepts custom values', () => {
    const cfg = envSchema.parse({ PORT: '3000', NODE_ENV: 'test' });
    expect(cfg.PORT).toBe(3000);
    expect(cfg.NODE_ENV).toBe('test');
  });

  it('rejects invalid NODE_ENV', () => {
    expect(() => envSchema.parse({ NODE_ENV: 'invalid' })).toThrow();
  });
});

describe('Auth Utilities', () => {
  it('generates and verifies JWT tokens', () => {
    const { sign, verify } = require('jsonwebtoken');
    const payload = { userId: 'user-1', role: 'user' };
    const token = sign(payload, 'test-secret', { expiresIn: '1h' });
    expect(token).toBeTruthy();
    const decoded = verify(token, 'test-secret') as { userId: string };
    expect(decoded.userId).toBe('user-1');
  });

  it('rejects invalid JWT tokens', () => {
    const { verify } = require('jsonwebtoken');
    expect(() => verify('invalid-token', 'test-secret')).toThrow();
  });
});

describe('Route Export Contracts', () => {
  it('notes route exports default router', async () => {
    const mod = await import('../routes/notes.js');
    expect(mod.default).toBeDefined();
  });

  it('users route exports default router', async () => {
    const mod = await import('../routes/users.js');
    expect(mod.default).toBeDefined();
  });

  it('workspaces route exports default router', async () => {
    const mod = await import('../routes/workspaces.js');
    expect(mod.default).toBeDefined();
  });
});
