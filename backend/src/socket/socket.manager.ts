import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerRoomHandlers } from './handlers/room.handler';
import { registerRtcHandlers } from './handlers/rtc.handler'; // <--- AJOUT
import { AuthenticatedSocket } from '../types';

export const typingUsers = new Map<string, Map<string, string>>();
export const onlineUsers = new Map<string, Set<string>>();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

export const initializeSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error"));
      (socket as AuthenticatedSocket).userId = decoded.userId;
      next();
    });
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { userId } = socket;

    console.log(`🟢 User ${userId} connected [${socket.id}]`);

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        io.emit('user_status_change', { userId, status: 'online' }); 
    }
    onlineUsers.get(userId)?.add(socket.id);

    socket.join(userId);

    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerRtcHandlers(io, socket); // <--- AJOUT

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status_change', { userId, status: 'offline' });
        }
      }

      typingUsers.forEach((usersInRoom, roomId) => {
        if (usersInRoom.has(userId)) {
            usersInRoom.delete(userId);
            const isConv = roomId.startsWith('conversation_');
            socket.to(roomId).emit('user_typing', { 
                userId, 
                isTyping: false,
                channelId: isConv ? undefined : roomId, 
                conversationId: isConv ? roomId.replace('conversation_', '') : undefined
            });
        }
        if (usersInRoom.size === 0) typingUsers.delete(roomId);
      });
    });
  });
};