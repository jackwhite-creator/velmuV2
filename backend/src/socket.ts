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
// Track which servers a user is connected to (socket rooms) for presence
export const userServerRooms = new Map<string, Set<string>>();

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

  // Broadcast presence only to relevant rooms (servers where the user is a member)
  const broadcastUserStatus = (userId: string, status: 'online' | 'offline') => {
      const serverIds = userServerRooms.get(userId);
      if (serverIds) {
          serverIds.forEach(serverId => {
              io.to(`server_${serverId}`).emit('user_status_change', { userId, status });
          });
      }
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
        // Do not emit immediately here. We wait until they join server rooms in `join_server` handler
        // OR we track their servers here if we had access to DB.
        // Better approach: Let `join_server` trigger the "I am here" presence for that specific server.
        // BUT `onlineUsers` is global.
        // So we just mark them online globally here. The broadcast happens when they join rooms or we can try to broadcast now if we knew rooms.
        // Since we don't know rooms yet, we rely on `join_server` to add them to rooms,
        // AND we rely on `join_server` to emit "Hey I'm online" to that room?
        // No, standard Discord behavior: You are online. If you share a server, you see it.
        // So when `join_server` happens, we should emit "User X is online" to that server room.
    }
    onlineUsers.get(userId)?.add(socket.id);
    if (!userServerRooms.has(userId)) userServerRooms.set(userId, new Set());
    
    // Register handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // User is fully offline
          onlineUsers.delete(userId);
          broadcastUserStatus(userId, 'offline');
          userServerRooms.delete(userId);
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
