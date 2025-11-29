import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';
import { typingUsers } from '../../socket';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const { userId } = socket;

    socket.on('typing_start', ({ channelId, conversationId, username }) => {
        // Ensure room naming consistency with room.handler.ts
        const room = channelId ? `channel_${channelId}` : `conversation_${conversationId}`;
        
        if (!typingUsers.has(room)) typingUsers.set(room, new Map());
        
        typingUsers.get(room)?.set(userId, username);

        socket.to(room).emit('user_typing', { 
            userId, username, channelId, conversationId, isTyping: true 
        });
    });

    socket.on('typing_stop', ({ channelId, conversationId, username }) => {
        const room = channelId ? `channel_${channelId}` : `conversation_${conversationId}`;
        const roomTypers = typingUsers.get(room);
        
        if (roomTypers) {
            roomTypers.delete(userId);
            if (roomTypers.size === 0) typingUsers.delete(room);
        }

        socket.to(room).emit('user_typing', { 
            userId, username, channelId, conversationId, isTyping: false 
        });
    });
};
