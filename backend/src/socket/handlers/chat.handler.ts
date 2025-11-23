import { Server, Socket } from 'socket.io';
import { typingUsers } from '../socket.manager';

export const registerChatHandlers = (io: Server, socket: Socket) => {
    const userId = (socket as any).userId;

    socket.on('typing_start', (data) => {
        const { channelId, conversationId, username } = data;
        const room = channelId || `conversation_${conversationId}`;

        if (!typingUsers.has(room)) {
            typingUsers.set(room, new Map());
        }
        typingUsers.get(room)?.set(userId, username);

        socket.to(room).emit('user_typing', { 
            userId, 
            username,
            channelId,
            conversationId,
            isTyping: true 
        });
    });

    socket.on('typing_stop', (data) => {
        const { channelId, conversationId, username } = data;
        const room = channelId || `conversation_${conversationId}`;

        const roomTypers = typingUsers.get(room);
        if (roomTypers) {
            roomTypers.delete(userId);
            if (roomTypers.size === 0) {
                typingUsers.delete(room);
            }
        }

        socket.to(room).emit('user_typing', { 
            userId, 
            username,
            channelId,
            conversationId,
            isTyping: false 
        });
    });
};