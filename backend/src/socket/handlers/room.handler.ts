import { Server, Socket } from 'socket.io';
import { SocketGuard } from '../../services/socket.guard';
import { typingUsers } from '../socket.manager';

export const registerRoomHandlers = (io: Server, socket: Socket) => {
    const userId = (socket as any).userId;

    const syncTypingState = (room: string, context: { channelId?: string, conversationId?: string }) => {
        const currentTypers = typingUsers.get(room);
        
        // CORRECTION : On définit explicitement le type du tableau
        const typingArray: { userId: string, username: string }[] = [];

        if (currentTypers && currentTypers.size > 0) {
            currentTypers.forEach((username, typerId) => {
                if (typerId !== userId) {
                    typingArray.push({ userId: typerId, username });
                }
            });
        }
        
        socket.emit('typing_state_snapshot', {
            ...context,
            users: typingArray
        });
    };

    socket.on('join_channel', async (channelId: string) => {
        try {
            const canJoin = await SocketGuard.validateChannelAccess(userId, channelId);
            if (!canJoin) return;

            socket.join(channelId);
            syncTypingState(channelId, { channelId });
        } catch (error) {
            console.error("Socket Join Channel Error:", error);
        }
    });
    
    socket.on('join_conversation', async (conversationId: string) => {
        try {
            const canJoin = await SocketGuard.validateConversationAccess(userId, conversationId);
            if (!canJoin) return;

            const room = `conversation_${conversationId}`;
            socket.join(room);
            syncTypingState(room, { conversationId });
        } catch (error) {
            console.error("Socket Join Conversation Error:", error);
        }
    });
    
    socket.on('join_server', async (serverId: string) => {
         const canJoin = await SocketGuard.validateServerAccess(userId, serverId);
         if (!canJoin) return;
         socket.join(`server_${serverId}`);
    });

    socket.on('leave_channel', (channelId: string) => {
        socket.leave(channelId);
    });
    socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation_${conversationId}`);
    });
};