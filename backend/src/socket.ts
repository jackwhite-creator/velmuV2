import { Server as HttpServer } from 'http'; // Import nécessaire
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketGuard } from './services/socket.guard';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const onlineUsers = new Map<string, Set<string>>();

// 👇 CHANGEMENT : On prend le HttpServer en entrée pour créer io nous-mêmes avec CORS
export const initSocket = (httpServer: HttpServer) => {

  // 1. Configuration CORS (Le correctif pour Vercel)
  const allowedOrigins = [
    "http://localhost:5173",             // Ton local frontend
    "https://velmu.vercel.app",          // Ton Vercel frontend
    process.env.CLIENT_URL               // Variable Render
  ].filter(Boolean) as string[];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // 2. Fonction utilitaire (Ton code)
  const broadcastOnlineUsers = () => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit('online_users_update', onlineUserIds);
  };

  // 3. Middleware d'auth (Ton code)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error"));
      (socket as any).userId = decoded.userId;
      next();
    });
  });

  // 4. Connexion et logique (Ton code intact)
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🟢 User ${userId} connected`);

    socket.join(userId); 
    
    // Ajout à la liste
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)?.add(socket.id);
    
    broadcastOnlineUsers();

    // --- EVENTS (Ton code) ---
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

    // --- DISCONNECT (Ton code) ---
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          broadcastOnlineUsers();
        }
      }
    });
  });

  // On retourne l'instance io pour server.ts
  return io;
};