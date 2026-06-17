import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { pool, healthCheck } from './db/connection.js';
import authRoutes from './auth/routes.js';
import notesRoutes from './routes/notes.js';
import workspacesRoutes from './routes/workspaces.js';
import usersRoutes from './routes/users.js';
import { authMiddleware } from './auth/middleware.js';
import { handleWsConnection } from './ws/handler.js';
import { serverLogger as log } from './logger.js';

log.info('Server starting', { port: config.PORT, wsPort: config.WS_PORT, env: config.NODE_ENV });

const app = express();
app.use(express.json());

// ---- Public routes ----
app.use('/api/auth', authRoutes);

// ---- Health ----
app.get('/health', async (_req, res) => {
  const db = await healthCheck();
  res.json({
    status: db ? 'ok' : 'degraded',
    uptime: process.uptime(),
    db: db ? 'connected' : 'disconnected',
  });
});

// ---- Protected routes ----
app.use('/api/notes', authMiddleware, notesRoutes);
app.use('/api/workspaces', authMiddleware, workspacesRoutes);
app.use('/api/users', authMiddleware, usersRoutes);

// ---- HTTP Server ----
const httpServer = createServer(app);
httpServer.listen(config.PORT, () => {
  log.info(`REST API on :${config.PORT}`);
});

// ---- WebSocket Server ----
const wss = new WebSocketServer({ port: config.WS_PORT });

wss.on('connection', (ws, req) => {
  handleWsConnection(ws, req);
});

log.info(`WebSocket on :${config.WS_PORT}`);

// ---- Graceful shutdown ----
const shutdown = async () => {
  log.info('shutting down...');
  wss.close();
  httpServer.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
