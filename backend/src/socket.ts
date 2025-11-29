import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';
import logger from './lib/logger';
import { registerRoomHandlers } from './socket/handlers/room.handler';
import { registerChatHandlers } from './socket/handlers/chat.handler';
import { AuthenticatedSocket } from './types';

// Shared state
export const typingUsers = new Map<string, Map<string, string>>();
export const onlineUsers = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {

  const io = new Server(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        const allowedOrigins = config.allowedOrigins;

        // If no origin (e.g. server to server), allow
        if (!requestOrigin) return callback(null, true);

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(origin => 
          origin && requestOrigin.startsWith(origin.replace(/\/$/, ""))
        );

        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked for origin', { origin: requestOrigin });
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const broadcastOnlineUsers = () => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit('online_users_update', onlineUserIds);
  };

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    jwt.verify(token, config.jwtSecret, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error"));
      (socket as AuthenticatedSocket).userId = decoded.userId;
      next();
    });
  });

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId;
    logger.info(`User connected: ${userId}`);

    // Join user room for notifications
    socket.join(`user_${userId}`); 
    
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        // Emit status change for incremental updates (future proofing / alternative to broadcast)
        io.emit('user_status_change', { userId, status: 'online' }); 
    }
    onlineUsers.get(userId)?.add(socket.id);
    
    // Broadcast full list for simplicity with current frontend
    broadcastOnlineUsers();

    // Register handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status_change', { userId, status: 'offline' });
          broadcastOnlineUsers();
        }
      }

      // Cleanup typing state
      typingUsers.forEach((usersInRoom, roomId) => {
        if (usersInRoom.has(userId)) {
            usersInRoom.delete(userId);
            const isConv = roomId.startsWith('conversation_');
            socket.to(roomId).emit('user_typing', { 
                userId, 
                username: '', // Username not strictly needed for stop typing
                isTyping: false,
                channelId: isConv ? undefined : roomId.replace('channel_', ''), 
                conversationId: isConv ? roomId.replace('conversation_', '') : undefined
            });
        }
        if (usersInRoom.size === 0) typingUsers.delete(roomId);
      });
      
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};
