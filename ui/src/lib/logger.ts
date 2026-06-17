type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SESSION_TS = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function getBridge(): { logFromFrontend: (level: string, message: string, data: string) => Promise<unknown> } | null {
  const win = window as unknown as Record<string, unknown>;
  const api = win.pywebview as
    | { api: Record<string, (...a: unknown[]) => Promise<unknown>> }
    | undefined;
  if (api?.api?.logFromFrontend) {
    return api.api as { logFromFrontend: (level: string, message: string, data: string) => Promise<unknown> };
  }
  const j = win.jarvis as
    | { logFromFrontend?: (level: string, message: string, data: string) => Promise<unknown> }
    | undefined;
  if (j?.logFromFrontend) return j as { logFromFrontend: (level: string, message: string, data: string) => Promise<unknown> };
  return null;
}

const pending: string[] = [];
let bridgeReady = false;

function flushPending() {
  const b = getBridge();
  if (!b) return;
  bridgeReady = true;
  for (const line of pending.splice(0)) {
    try {
      const parsed = JSON.parse(line);
      b.logFromFrontend(parsed.level, parsed.message, parsed.data || '');
    } catch { /* ignore */ }
  }
}

type TimedMethod = <T>(label: string, fn: () => T) => T;

class Logger {
  private source: string;

  constructor(source = 'frontend') {
    this.source = source;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry = {
      level,
      message,
      data: data ? JSON.stringify(data) : '',
      source: this.source,
      timestamp: new Date().toISOString(),
    };

    const payload = JSON.stringify(entry);

    const bridge = getBridge();
    if (bridge && bridgeReady) {
      bridge.logFromFrontend(level, message, entry.data || '');
    } else if (bridge) {
      pending.push(payload);
    }

    const fn = console[level] || console.log;
    fn(`[${this.source}] ${message}`, data || '');
  }

  debug(message: string, data?: Record<string, unknown>) { this.log('debug', message, data); }

  info(message: string, data?: Record<string, unknown>) { this.log('info', message, data); }

  warn(message: string, data?: Record<string, unknown>) { this.log('warn', message, data); }

  error(message: string, error?: unknown) {
    const data = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { detail: String(error ?? '') };
    this.log('error', message, data);
  }

  timed: TimedMethod = <T>(label: string, fn: () => T): T => {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const elapsed = Math.round(performance.now() - start);
      if (elapsed > 100) {
        this.info(`timed:${label}`, { elapsed });
      }
    }
  };

  async timedAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const elapsed = Math.round(performance.now() - start);
      if (elapsed > 200) {
        this.info(`timed:${label}`, { elapsed });
      }
    }
  }
}

const logger = new Logger('frontend');

export { Logger };
export { flushPending };
export { SESSION_TS };
export default logger;
