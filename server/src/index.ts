import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '8080', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8081', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// --- Health ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- HTTP Server ---
const httpServer = createServer(app);
httpServer.listen(PORT, () => {
  console.log(`[sync] REST API on :${PORT}`);
});

// --- WebSocket Server ---
const wss = new WebSocketServer({ port: WS_PORT });
const sessions = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://localhost`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'token required');
    return;
  }

  let payload: { userId: string; workspaceId: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as any;
  } catch {
    ws.close(4001, 'invalid token');
    return;
  }

  const key = payload.workspaceId;
  if (!sessions.has(key)) sessions.set(key, new Set());
  sessions.get(key)!.add(ws);

  console.log(`[ws] user ${payload.userId} joined workspace ${key}`);

  ws.on('message', (data) => {
    // Broadcast para todos no mesmo workspace
    const message = data.toString();
    sessions.get(key)?.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    sessions.get(key)?.delete(ws);
    if (sessions.get(key)?.size === 0) sessions.delete(key);
  });
});

console.log(`[sync] WebSocket on :${WS_PORT}`);
