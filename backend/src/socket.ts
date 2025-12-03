import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';
import logger from './lib/logger';
import { registerRoomHandlers } from './socket/handlers/room.handler';
import { registerChatHandlers } from './socket/handlers/chat.handler';
import { AuthenticatedSocket } from './types';
import { friendRepository, memberRepository } from './repositories';

// Shared state
export const typingUsers = new Map<string, Map<string, string>>();
export const onlineUsers = new Map<string, Set<string>>();
// Track which servers a user is connected to (socket rooms) for presence
export const userServerRooms = new Map<string, Set<string>>();
// Track voice channel state: userId -> { channelId, serverId }
export const voiceStates = new Map<string, { channelId: string, serverId: string }>();

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
      (socket as AuthenticatedSocket).userType = decoded.type;
      next();
    });
  });

  io.on('connection', async (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId;
    const userType = socket.userType;
    logger.info(`User connected: ${userId} (${userType || 'user'})`);

    // Join user room for notifications
    socket.join(`user_${userId}`); 
    
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)?.add(socket.id);
    if (!userServerRooms.has(userId)) userServerRooms.set(userId, new Set());

    // --- MUTUAL SERVER & FRIEND PRESENCE LOGIC START ---
    try {
        const [friends, serverIds] = await Promise.all([
            friendRepository.findFriends(userId),
            memberRepository.findUserServers(userId)
        ]);

        const onlineUserIds = new Set<string>();

        // 1. Handle Friends
        friends.forEach(friend => {
            const friendId = friend.senderId === userId ? friend.receiverId : friend.senderId;
            if (onlineUsers.has(friendId)) {
                onlineUserIds.add(friendId);
                // Notify friend
                io.to(`user_${friendId}`).emit('user_status_change', { userId, status: 'online' });
            }
        });

        // 2. Handle Mutual Servers
        // Automatically join all server rooms to receive status updates and emit presence
        serverIds.forEach(serverId => {
            const roomName = `server_${serverId}`;
            socket.join(roomName);
            
            // If bot, join special bot room to receive all messages
            if (userType === 'bot') {
                socket.join(`server_${serverId}_bots`);
            }
            
            // Track that we are in this server room
            userServerRooms.get(userId)?.add(serverId);

            // Notify everyone in this server that I am online
            socket.to(roomName).emit('user_status_change', { userId, status: 'online' });

            // Collect online users from this server
            const roomSockets = io.sockets.adapter.rooms.get(roomName);
            if (roomSockets) {
                roomSockets.forEach(socketId => {
                    const remoteSocket = io.sockets.sockets.get(socketId) as AuthenticatedSocket;
                    if (remoteSocket && remoteSocket.userId && remoteSocket.userId !== userId) {
                        onlineUserIds.add(remoteSocket.userId);
                    }
                });
            }
        });

        // Send me the list of ALL online users (friends + mutual server members)
        if (onlineUserIds.size > 0) {
            socket.emit('online_users_update', Array.from(onlineUserIds));
        }

    } catch (err) {
        logger.error('Error handling connection presence', err);
    }
    // --- MUTUAL SERVER & FRIEND PRESENCE LOGIC END ---
    
    // --- VOICE STATE LOGIC START ---
    socket.on('join_voice', ({ channelId, serverId, initialState }) => {
        // Leave previous channel if any
        const previousState = voiceStates.get(userId);
        
        // If user was already in a channel
        if (previousState) {
            // Leave the old socket room
            socket.leave(`voice_${previousState.channelId}`);
            
            // Notify the OLD server that the user left
            // This is crucial if the user switches servers or channels
            io.to(`server_${previousState.serverId}`).emit('voice_state_update', { 
                userId, 
                channelId: null, 
                previousChannelId: previousState.channelId,
                serverId: previousState.serverId // Send serverId so frontend knows where to remove
            });
        }

        const newState = { 
            channelId, 
            serverId,
            isMuted: initialState?.isMuted || false,
            isDeafened: initialState?.isDeafened || false,
            isCameraOn: initialState?.isCameraOn || false,
            isScreenShareOn: initialState?.isScreenShareOn || false
        };

        voiceStates.set(userId, newState);
        socket.join(`voice_${channelId}`);
        
        // Broadcast to NEW server members that user joined voice with state
        io.to(`server_${serverId}`).emit('voice_state_update', { 
            userId, 
            channelId,
            ...newState
        });
    });

    socket.on('voice_state_change', (changes) => {
        const currentState = voiceStates.get(userId);
        if (currentState) {
            const updatedState = { ...currentState, ...changes };
            voiceStates.set(userId, updatedState);
            
            // Broadcast update
            io.to(`server_${currentState.serverId}`).emit('voice_state_update', {
                userId,
                channelId: currentState.channelId,
                ...updatedState
            });
        }
    });

    socket.on('leave_voice', ({ channelId, serverId }) => {
        voiceStates.delete(userId);
        socket.leave(`voice_${channelId}`);
        io.to(`server_${serverId}`).emit('voice_state_update', { userId, channelId: null, previousChannelId: channelId });
    });
    // --- VOICE STATE LOGIC END ---

    // Register handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', async () => {
      // --- VOICE STATE CLEANUP ---
      const voiceState = voiceStates.get(userId);
      if (voiceState) {
          voiceStates.delete(userId);
          // Notify the server the user was in
          io.to(`server_${voiceState.serverId}`).emit('voice_state_update', { 
              userId, 
              channelId: null, 
              previousChannelId: voiceState.channelId 
          });
      }
      
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // User is fully offline
          onlineUsers.delete(userId);
          
          // Broadcast to servers (handled by broadcastUserStatus via userServerRooms)
          broadcastUserStatus(userId, 'offline');
          
          userServerRooms.delete(userId);

          // --- FRIEND PRESENCE LOGIC START (DISCONNECT) ---
          try {
              const friends = await friendRepository.findFriends(userId);
              friends.forEach(friend => {
                  const friendId = friend.senderId === userId ? friend.receiverId : friend.senderId;
                  if (onlineUsers.has(friendId)) {
                      io.to(`user_${friendId}`).emit('user_status_change', { userId, status: 'offline' });
                  }
              });
          } catch (err) {
              logger.error('Error fetching friends for disconnect presence', err);
          }
          // --- FRIEND PRESENCE LOGIC END ---
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
