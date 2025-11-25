import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';
import { SocketGuard } from '../../services/socket.guard';
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
        if (!await SocketGuard.validateChannelAccess(userId, channelId)) return;
        socket.join(channelId);
        syncTypingState(channelId, { channelId });
    });
    
    socket.on('join_conversation', async (conversationId: string) => {
        if (!await SocketGuard.validateConversationAccess(userId, conversationId)) return;
        const room = `conversation_${conversationId}`;
        socket.join(room);
        syncTypingState(room, { conversationId });
    });
    
    socket.on('join_server', async (serverId: string) => {
         if (await SocketGuard.validateServerAccess(userId, serverId)) {
             socket.join(`server_${serverId}`);
         }
    });

    socket.on('leave_channel', (id) => socket.leave(id));
    socket.on('leave_conversation', (id) => socket.leave(`conversation_${id}`));
    socket.on('leave_server', (id) => socket.leave(`server_${id}`));
};