import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken, JwtPayload } from '../auth/jwt.js';
import { joinRoom, leaveRoom, broadcastToRoom, removeFromAllRooms } from './rooms.js';
import { resolveNoteUpdate } from './sync.js';

interface WsMessage {
  type: string;
  [key: string]: any;
}

export function handleWsConnection(ws: WebSocket, req: IncomingMessage): void {
  const url = new URL(req.url || '/', `http://localhost`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'token required');
    return;
  }

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    ws.close(4001, 'invalid token');
    return;
  }

  const userId = payload.userId;
  let currentWorkspace: string | null = null;

  ws.on('message', async (data) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'invalid JSON' }));
      return;
    }

    switch (msg.type) {
      case 'subscribe': {
        const workspaceId = msg.workspaceId as string;
        if (!workspaceId) {
          ws.send(JSON.stringify({ type: 'error', message: 'workspaceId required' }));
          return;
        }
        if (currentWorkspace) {
          leaveRoom(currentWorkspace, ws);
        }
        currentWorkspace = workspaceId;
        joinRoom(workspaceId, userId, ws);
        break;
      }

      case 'note:update': {
        if (!currentWorkspace) {
          ws.send(JSON.stringify({ type: 'error', message: 'subscribe to a workspace first' }));
          return;
        }
        const result = await resolveNoteUpdate({
          noteId: msg.noteId,
          title: msg.title,
          content: msg.content,
          version: msg.version,
          userId,
        });

        if (result.accepted) {
          broadcastToRoom(currentWorkspace, {
            type: 'note:updated',
            noteId: msg.noteId,
            title: msg.title,
            content: msg.content,
            version: result.currentVersion,
            updatedBy: userId,
          }, ws);
        } else {
          ws.send(JSON.stringify({
            type: 'note:conflict',
            noteId: msg.noteId,
            currentVersion: result.currentVersion,
            diff: result.diff,
          }));
        }
        break;
      }

      case 'note:select': {
        if (currentWorkspace) {
          broadcastToRoom(currentWorkspace, {
            type: 'note:selected',
            noteId: msg.noteId,
            userId,
          }, ws);
        }
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `unknown message type: ${msg.type}` }));
    }
  });

  ws.on('close', () => {
    if (currentWorkspace) {
      leaveRoom(currentWorkspace, ws);
    }
    removeFromAllRooms(ws);
  });

  ws.on('error', () => {
    if (currentWorkspace) {
      leaveRoom(currentWorkspace, ws);
    }
    removeFromAllRooms(ws);
  });
}

// Exported for use by REST routes
export function broadcastToWorkspace(workspaceId: string, message: object): number {
  return broadcastToRoom(workspaceId, message);
}
