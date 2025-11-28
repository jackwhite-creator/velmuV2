import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';
import logger from './lib/logger';
import { registerRoomHandlers } from './socket/handlers/room.handler';

const onlineUsers = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {

  const io = new Server(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        const allowedOrigins = config.allowedOrigins;

        // Si pas d'origine (ex: appel serveur à serveur), on autorise
        if (!requestOrigin) return callback(null, true);

        // On vérifie si l'origine est dans la liste
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
      (socket as any).userId = decoded.userId;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.info(`User connected: ${userId}`);

    // Fix: join 'user_ID' to match friend.controller emission
    socket.join(`user_${userId}`); 
    
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)?.add(socket.id);
    
    broadcastOnlineUsers();

    // Use the modular handler
    registerRoomHandlers(io, socket as any);

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          broadcastOnlineUsers();
        }
      }
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};