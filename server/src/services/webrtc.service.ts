import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

type UserMap = Map<string, string>;

const activeUsers: Map<string, UserMap> = new Map();
const waitingUsers: Map<string, UserMap> = new Map();

const getMap = (map: Map<string, UserMap>, roomId: string) => {
  if (!map.has(roomId)) map.set(roomId, new Map());
  return map.get(roomId)!;
};

const addUser = (map: Map<string, UserMap>, roomId: string, userId: string, socketId: string) => {
  const roomMap = getMap(map, roomId);
  roomMap.set(userId, socketId);
};

const removeUser = (map: Map<string, UserMap>, roomId: string, userId: string) => {
  const roomMap = map.get(roomId);
  if (!roomMap) return false;
  const existed = roomMap.delete(userId);
  if (roomMap.size === 0) map.delete(roomId);
  return existed;
};

const listUsers = (roomId: string, excludeUserId?: string) => {
  const roomMap = activeUsers.get(roomId);
  if (!roomMap) return [] as { userId: string; socketId: string }[];
  return Array.from(roomMap.entries())
    .filter(([userId]) => userId !== excludeUserId)
    .map(([userId, socketId]) => ({ userId, socketId }));
};

const joinActiveRoom = (roomId: string, userId: string, socket: Socket, namespace: any) => {
  addUser(activeUsers, roomId, userId, socket.id);
  socket.join(roomId);

  const users = listUsers(roomId, userId);
  socket.emit('existing-users', { users });
  socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
};

export function initWebRTCSignaling(io: SocketServer) {
  const webrtcNamespace = io.of('/webrtc');

  webrtcNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId?: string; roomId?: string };
      if (!payload?.userId) return next(new Error('unauthorized'));
      socket.data.userId = payload.userId;
      socket.data.roomId = payload.roomId;
      next();
    } catch (error) {
      next(new Error('unauthorized'));
    }
  });

  webrtcNamespace.on('connection', (socket: Socket) => {
    handleSocketConnection(socket, webrtcNamespace);
  });
}

function handleSocketConnection(socket: Socket, namespace: any) {
  let currentRoomId: string | null = null;
  let currentUserId: string | null = socket.data.userId || null;

  const handle = (event: string, handler: (data: any) => Promise<void> | void) => {
    socket.on(event, async (data) => {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error in socket event '${event}':`, error);
      }
    });
  };

  handle('join-room', async (data) => {
    const roomId = data?.roomId;
    const userId = data?.userId;
    if (!roomId || !userId) return;

    if (currentUserId && currentUserId !== userId) {
      socket.emit('join-denied', { reason: 'unauthorized' });
      return;
    }
    if (socket.data.roomId && socket.data.roomId !== roomId) {
      socket.emit('join-denied', { reason: 'unauthorized' });
      return;
    }

    const room = await prisma.videoRoom.findUnique({
      where: { id: roomId },
      select: { id: true, hostId: true, enableWaitingRoom: true, status: true }
    });

    if (!room || ['ended', 'cancelled'].includes(room.status)) {
      socket.emit('join-denied', { reason: 'room_unavailable' });
      return;
    }

    currentRoomId = roomId;
    currentUserId = userId;
    (socket as any).userId = userId;

    const isHost = room.hostId === userId;

    if (room.enableWaitingRoom && !isHost) {
      addUser(waitingUsers, roomId, userId, socket.id);
      socket.join(`waiting-${roomId}`);
      socket.emit('waiting-room', { roomId });

      const hostSocketId = activeUsers.get(roomId)?.get(room.hostId);
      if (hostSocketId) {
        namespace.to(hostSocketId).emit('waiting-user', { userId });
      }
      return;
    }

    joinActiveRoom(roomId, userId, socket, namespace);

    if (isHost) {
      const waitingList = waitingUsers.get(roomId);
      if (waitingList) {
        waitingList.forEach((_socketId, waitingUserId) => {
          namespace.to(socket.id).emit('waiting-user', { userId: waitingUserId });
        });
      }
    }
  });

  handle('offer', (data) => {
    if (!currentRoomId || !currentUserId) return;
    const targetSocketId = activeUsers.get(currentRoomId)?.get(data.targetUserId);
    if (!targetSocketId) return;
    socket.to(targetSocketId).emit('offer', { fromUserId: currentUserId, offer: data.offer });
  });

  handle('answer', (data) => {
    if (!currentRoomId || !currentUserId) return;
    const targetSocketId = activeUsers.get(currentRoomId)?.get(data.targetUserId);
    if (!targetSocketId) return;
    socket.to(targetSocketId).emit('answer', { fromUserId: currentUserId, answer: data.answer });
  });

  handle('ice-candidate', (data) => {
    if (!currentRoomId || !currentUserId) return;
    const targetSocketId = activeUsers.get(currentRoomId)?.get(data.targetUserId);
    if (!targetSocketId) return;
    socket.to(targetSocketId).emit('ice-candidate', { fromUserId: currentUserId, candidate: data.candidate });
  });

  handle('gesture', (data) => {
    if (currentRoomId) socket.to(currentRoomId).emit('gesture', { userId: currentUserId, gesture: data.gesture });
  });

  handle('caption', (data) => {
    if (currentRoomId) socket.to(currentRoomId).emit('caption', { userId: currentUserId, text: data.text });
  });

  handle('admit-user', async (data) => {
    const roomId = data?.roomId;
    const userId = data?.userId;
    if (!roomId || !userId || !currentUserId) return;

    const room = await prisma.videoRoom.findUnique({ where: { id: roomId }, select: { hostId: true } });
    if (!room || room.hostId !== currentUserId) return;

    const waitingSocketId = waitingUsers.get(roomId)?.get(userId);
    if (!waitingSocketId) return;

    waitingUsers.get(roomId)?.delete(userId);
    if (waitingUsers.get(roomId)?.size === 0) waitingUsers.delete(roomId);

    const waitingSocket = namespace.sockets.get(waitingSocketId);
    if (!waitingSocket) return;

    waitingSocket.leave(`waiting-${roomId}`);
    joinActiveRoom(roomId, userId, waitingSocket, namespace);
    waitingSocket.emit('admitted', { roomId });

    namespace.to(`waiting-${roomId}`).emit('waiting-user-left', { userId });
    const hostSocketId = activeUsers.get(roomId)?.get(room.hostId);
    if (hostSocketId) namespace.to(hostSocketId).emit('waiting-user-left', { userId });
  });

  handle('host-mute-all', async (data) => {
    const roomId = data?.roomId || currentRoomId;
    if (!roomId || !currentUserId) return;

    const room = await prisma.videoRoom.findUnique({ where: { id: roomId }, select: { hostId: true } });
    if (!room || room.hostId !== currentUserId) return;

    namespace.to(roomId).emit('host-mute-all', { userId: currentUserId });
  });

  socket.on('disconnect', () => {
    if (!currentRoomId || !currentUserId) return;

    const wasActive = removeUser(activeUsers, currentRoomId, currentUserId);
    if (wasActive) {
      socket.to(currentRoomId).emit('user-left', { userId: currentUserId, socketId: socket.id });
      return;
    }

    const wasWaiting = removeUser(waitingUsers, currentRoomId, currentUserId);
    if (wasWaiting) {
      namespace.to(`waiting-${currentRoomId}`).emit('waiting-user-left', { userId: currentUserId });
      const roomMap = activeUsers.get(currentRoomId);
      if (roomMap) {
        roomMap.forEach((socketId) => {
          namespace.to(socketId).emit('waiting-user-left', { userId: currentUserId });
        });
      }
    }
  });
}
