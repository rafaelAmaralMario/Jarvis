import * as fs from 'node:fs';
import * as path from 'node:path';
import { logDir } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SESSION_TS = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const LEVEL_MAP: Record<LogLevel, string> = {
  debug: 'info',
  info: 'info',
  warn: 'warnings',
  error: 'errors',
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function write(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const sub = LEVEL_MAP[level] || 'info';
  const dir = path.join(logDir, 'server', sub);
  ensureDir(dir);

  const filePath = path.join(dir, `${SESSION_TS}.log`);
  const ts = new Date().toISOString();
  const line = data
    ? `[${ts}] ${level.toUpperCase()} — ${message} | ${JSON.stringify(data)}\n`
    : `[${ts}] ${level.toUpperCase()} — ${message}\n`;

  fs.appendFileSync(filePath, line, 'utf-8');

  if (level === 'error' || level === 'warn') {
    process.stderr.write(`[server] ${message}\n`);
  }
}

export const serverLogger = {
  debug: (msg: string, data?: Record<string, unknown>) => write('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => write('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => write('warn', msg, data),
  error: (msg: string, error?: unknown) => {
    const data = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { detail: String(error ?? '') };
    write('error', msg, data);
  },
};
