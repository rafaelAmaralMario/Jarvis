import { Pool } from 'pg';
import { config } from '../config.js';

export const pool = new Pool({ connectionString: config.DATABASE_URL });

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.NODE_ENV === 'development') {
    console.log('[db] query', { text: text.slice(0, 80), duration, rows: result.rowCount });
  }
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
