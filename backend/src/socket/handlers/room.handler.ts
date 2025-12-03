import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';
import { memberRepository, conversationRepository, channelRepository } from '../../repositories';
import { typingUsers, onlineUsers, userServerRooms, voiceStates } from '../../socket';

export const registerRoomHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const { userId } = socket;

    const syncTypingState = (room: string, context: { channelId?: string, conversationId?: string }) => {
        const currentTypers = typingUsers.get(room);
        const typingArray: { userId: string, username: string }[] = [];

        if (currentTypers && currentTypers.size > 0) {
            currentTypers.forEach((username, typerId) => {
                if (typerId !== userId) typingArray.push({ userId: typerId, username });
            });
        }
        
        if (typingArray.length > 0) {
            socket.emit('typing_state_snapshot', { ...context, users: typingArray });
        }
    };

    socket.on('join_channel', async (channelId: string) => {
        const channel = await channelRepository.findById(channelId);
        if (!channel) return;
        
        const isMember = await memberRepository.isMember(userId, channel.serverId);
        if (!isMember) return;

        socket.join(`channel_${channelId}`);
        syncTypingState(`channel_${channelId}`, { channelId });
    });
    
    socket.on('join_conversation', async (conversationId: string) => {
        const isMember = await conversationRepository.isMember(conversationId, userId);
        if (!isMember) return;

        const room = `conversation_${conversationId}`;
        socket.join(room);
        syncTypingState(room, { conversationId });
    });
    
    socket.on('join_server', async (serverId: string) => {
         const isMember = await memberRepository.isMember(userId, serverId);
         if (isMember) {
             const roomName = `server_${serverId}`;
             socket.join(roomName);

             // Track that this user is listening to this server
             if (!userServerRooms.has(userId)) userServerRooms.set(userId, new Set());
             userServerRooms.get(userId)?.add(serverId);

             // Broadcast that I am online to this server (if I am actually online, which I am)
             socket.to(roomName).emit('user_status_change', { userId, status: 'online' });

             // Send back the list of currently online users *in this server* to the client
             const roomSockets = io.sockets.adapter.rooms.get(roomName);
             const onlineUserIdsInServer = new Set<string>();

             if (roomSockets) {
                 // Optimization: Direct access to socket.data.userId via io.sockets.sockets
                 // This avoids the O(N*M) loop searching through onlineUsers map
                 roomSockets.forEach(socketId => {
                     const remoteSocket = io.sockets.sockets.get(socketId) as AuthenticatedSocket;
                     if (remoteSocket && remoteSocket.userId) {
                         onlineUserIdsInServer.add(remoteSocket.userId);
                     }
                 });
             }

             socket.emit('server_online_users', { serverId, userIds: Array.from(onlineUserIdsInServer) });

             // Send current voice states for this server
             const voiceStatesInServer: { userId: string, channelId: string, isMuted?: boolean, isDeafened?: boolean, isCameraOn?: boolean, isScreenShareOn?: boolean }[] = [];
             
             voiceStates.forEach((state: { channelId: string, serverId: string, isMuted?: boolean, isDeafened?: boolean, isCameraOn?: boolean, isScreenShareOn?: boolean }, uId: string) => {
                 if (state.serverId === serverId) {
                     voiceStatesInServer.push({ 
                         userId: uId, 
                         channelId: state.channelId,
                         isMuted: state.isMuted,
                         isDeafened: state.isDeafened,
                         isCameraOn: state.isCameraOn,
                         isScreenShareOn: state.isScreenShareOn
                     });
                 }
             });
             
             if (voiceStatesInServer.length > 0) {
                 socket.emit('server_voice_states', { serverId, states: voiceStatesInServer });
             }
         }
    });

    socket.on('leave_channel', (id) => socket.leave(`channel_${id}`));
    socket.on('leave_conversation', (id) => socket.leave(`conversation_${id}`));
    socket.on('leave_server', (id) => socket.leave(`server_${id}`));
};
