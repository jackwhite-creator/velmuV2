import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';

const usersInRoom: Record<string, string[]> = {};
const socketToRoom: Record<string, string> = {};

export const registerRtcHandlers = (io: Server, socket: AuthenticatedSocket) => {
    
    socket.on("join_voice_channel", (roomId: string) => {
        if (usersInRoom[roomId]) {
            const length = usersInRoom[roomId].length;
            if (length >= 4) {
                socket.emit("room_full");
                return;
            }
            usersInRoom[roomId].push(socket.id);
        } else {
            usersInRoom[roomId] = [socket.id];
        }
        
        socketToRoom[socket.id] = roomId;
        const usersInThisRoom = usersInRoom[roomId].filter(id => id !== socket.id);

        socket.emit("all_users_in_room", usersInThisRoom);
    });

    socket.on("sending_signal", (payload) => {
        io.to(payload.userToSignal).emit('user_joined_voice', { 
            signal: payload.signal, 
            callerID: payload.callerID 
        });
    });

    socket.on("returning_signal", (payload) => {
        io.to(payload.callerID).emit('receiving_returned_signal', { 
            signal: payload.signal, 
            id: socket.id 
        });
    });

    socket.on("leave_voice_channel", () => {
        const roomId = socketToRoom[socket.id];
        if (usersInRoom[roomId]) {
            usersInRoom[roomId] = usersInRoom[roomId].filter(id => id !== socket.id);
            if (usersInRoom[roomId].length === 0) {
                delete usersInRoom[roomId];
            }
        }
        delete socketToRoom[socket.id];
        socket.broadcast.emit("user_left_voice", socket.id);
    });

    socket.on('disconnect', () => {
        const roomId = socketToRoom[socket.id];
        if (usersInRoom[roomId]) {
            usersInRoom[roomId] = usersInRoom[roomId].filter(id => id !== socket.id);
            if (usersInRoom[roomId].length === 0) {
                delete usersInRoom[roomId];
            }
        }
        delete socketToRoom[socket.id];
        socket.broadcast.emit("user_left_voice", socket.id);
    });
};