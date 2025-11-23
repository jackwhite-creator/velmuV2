import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerRoomHandlers } from './handlers/room.handler';

export const typingUsers = new Map<string, Map<string, string>>();
export const onlineUsers = new Map<string, Set<string>>();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

export const initializeSocket = (io: Server) => {
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error"));
      (socket as any).userId = decoded.userId;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🟢 User ${userId} connected [${socket.id}]`);

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        io.emit('user_status_change', { userId, status: 'online' }); 
    }
    onlineUsers.get(userId)?.add(socket.id);

    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

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
            
            const isConversation = roomId.startsWith('conversation_');
            socket.to(roomId).emit('user_typing', { 
                userId, 
                isTyping: false,
                channelId: isConversation ? undefined : roomId, 
                conversationId: isConversation ? roomId.replace('conversation_', '') : undefined
            });
        }
        if (usersInRoom.size === 0) {
            typingUsers.delete(roomId);
        }
      });
    });
  });
};