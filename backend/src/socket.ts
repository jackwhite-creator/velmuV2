import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketGuard } from './services/socket.guard';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const onlineUsers = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {

  const io = new Server(httpServer, {
    cors: {
      // 👇 CORRECTION MAJEURE : On utilise une fonction pour être plus souple
      origin: (requestOrigin, callback) => {
        const allowedOrigins = [
          "http://localhost:5173",
          "https://velmu.vercel.app",
          process.env.CLIENT_URL
        ];

        // 1. Si pas d'origine (ex: appel serveur à serveur), on autorise
        if (!requestOrigin) return callback(null, true);

        // 2. On vérifie si l'origine est dans la liste (en ignorant le slash de fin)
        const isAllowed = allowedOrigins.some(origin => 
          origin && requestOrigin.startsWith(origin.replace(/\/$/, "")) // On retire le slash final pour comparer
        );

        if (isAllowed) {
          callback(null, true);
        } else {
          console.log("🔴 CORS Bloqué pour l'origine :", requestOrigin); // Utile pour les logs Render
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
    
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)?.add(socket.id);
    
    broadcastOnlineUsers();

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

    socket.on('leave_channel', (channelId: string) => {
        socket.leave(channelId);
    });
    socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation_${conversationId}`);
    });

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

  return io;
};