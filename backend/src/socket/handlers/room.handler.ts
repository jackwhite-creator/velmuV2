import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';
import { memberRepository, conversationRepository, channelRepository } from '../../repositories';
import { typingUsers } from '../socket.manager';

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
        syncTypingState(channelId, { channelId });
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
             socket.join(`server_${serverId}`);
         }
    });

    socket.on('leave_channel', (id) => socket.leave(`channel_${id}`));
    socket.on('leave_conversation', (id) => socket.leave(`conversation_${id}`));
    socket.on('leave_server', (id) => socket.leave(`server_${id}`));

    socket.on('typing_start', (data: any) => {
        const room = data.channelId ? `channel_${data.channelId}` : `conversation_${data.conversationId}`;
        socket.to(room).emit('user_typing', { ...data, userId, isTyping: true });
    });
    
    socket.on('typing_stop', (data: any) => {
        const room = data.channelId ? `channel_${data.channelId}` : `conversation_${data.conversationId}`;
        socket.to(room).emit('user_typing', { ...data, userId, isTyping: false });
    });
};