import * as path from 'node:path';
import * as os from 'node:os';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  WS_PORT: z.coerce.number().default(8081),
  DATABASE_URL: z.string().default('postgres://jarvis:jarvis-dev@localhost:5432/jarvis'),
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const config = envSchema.parse(process.env);

export const logDir = process.env.LOG_DIR || path.join(os.homedir(), '.jarvis', 'logs');
