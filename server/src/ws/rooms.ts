import { WebSocket } from 'ws';

interface Room {
  members: Map<string, WebSocket>;
  userMap: Map<WebSocket, string>; // ws -> userId
}

const rooms = new Map<string, Room>();

export function joinRoom(workspaceId: string, userId: string, ws: WebSocket): void {
  if (!rooms.has(workspaceId)) {
    rooms.set(workspaceId, { members: new Map(), userMap: new Map() });
  }
  const room = rooms.get(workspaceId)!;
  room.members.set(userId, ws);
  room.userMap.set(ws, userId);

  broadcastToRoom(workspaceId, {
    type: 'user:joined',
    userId,
    workspaceId,
  }, ws);
}

export function leaveRoom(workspaceId: string, ws: WebSocket): void {
  const room = rooms.get(workspaceId);
  if (!room) return;

  const userId = room.userMap.get(ws);
  if (userId) {
    room.members.delete(userId);
    room.userMap.delete(ws);

    broadcastToRoom(workspaceId, {
      type: 'user:left',
      userId,
      workspaceId,
    });
  }

  if (room.members.size === 0) {
    rooms.delete(workspaceId);
  }
}

export function broadcastToRoom(workspaceId: string, message: object, exclude?: WebSocket): number {
  const room = rooms.get(workspaceId);
  if (!room) return 0;

  const raw = JSON.stringify(message);
  let count = 0;

  room.members.forEach((ws, userId) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(raw);
      count++;
    }
  });

  return count;
}

export function removeFromAllRooms(ws: WebSocket): void {
  rooms.forEach((room, workspaceId) => {
    const userId = room.userMap.get(ws);
    if (userId) {
      room.members.delete(userId);
      room.userMap.delete(ws);
      broadcastToRoom(workspaceId, { type: 'user:left', userId, workspaceId });
    }
    if (room.members.size === 0) {
      rooms.delete(workspaceId);
    }
  });
}

export function getRoomSize(workspaceId: string): number {
  return rooms.get(workspaceId)?.members.size ?? 0;
}
