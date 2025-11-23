import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketGuard } from './services/socket.guard';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const onlineUsers = new Map<string, Set<string>>();

export const initializeSocket = (io: Server) => {
  
  // Fonction utilitaire pour diffuser la liste complète
  const broadcastOnlineUsers = () => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit('online_users_update', onlineUserIds);
  };

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
    console.log(`🟢 User ${userId} connected`);

    socket.join(userId); 
    
    // Ajout à la liste
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)?.add(socket.id);
    
    // 👇 CHANGEMENT : On diffuse la nouvelle liste complète à tout le monde
    broadcastOnlineUsers();

    // --- EVENTS SÉCURISÉS (Reste inchangé) ---
    socket.on('join_channel', async (channelId) => {
        const canJoin = await SocketGuard.validateChannelAccess(userId, channelId);
        if (!canJoin) return socket.emit('error', { message: "Access Denied" });
        socket.join(channelId);
    });
    
    socket.on('join_conversation', async (conversationId) => {
        const canJoin = await SocketGuard.validateConversationAccess(userId, conversationId);
        if (!canJoin) return socket.emit('error', { message: "Access Denied" });
        socket.join(`conversation_${conversationId}`);
    });
    
    socket.on('join_server', async (serverId) => {
         const canJoin = await SocketGuard.validateServerAccess(userId, serverId);
         if (!canJoin) return;
         socket.join(`server_${serverId}`);
    });

    socket.on('typing_start', (data) => {
        const room = data.channelId || `conversation_${data.conversationId}`;
        socket.to(room).emit('user_typing', { ...data, userId, isTyping: true });
    });
    
    socket.on('typing_stop', (data) => {
        const room = data.channelId || `conversation_${data.conversationId}`;
        socket.to(room).emit('user_typing', { ...data, userId, isTyping: false });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        // Si l'utilisateur n'a plus aucun socket ouvert (fenêtre fermée partout)
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // 👇 CHANGEMENT : On diffuse la liste mise à jour
          broadcastOnlineUsers();
        }
      }
    });
  });
};