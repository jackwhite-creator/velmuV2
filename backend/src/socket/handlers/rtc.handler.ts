import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types';

export const registerRtcHandlers = (io: Server, socket: AuthenticatedSocket) => {
    
    socket.on("join_voice_channel", async (roomId: string) => {
        // 1. On rejoint officiellement la "room" Socket.IO
        await socket.join(roomId);
        
        // 2. On demande à Socket.IO la liste des sockets présents dans cette room
        const socketsInRoom = await io.in(roomId).fetchSockets();
        
        // 3. On filtre pour ne garder que les ID des AUTRES utilisateurs
        const usersInThisRoom = socketsInRoom
            .map(s => s.id)
            .filter(id => id !== socket.id);

        // 4. S'il y a trop de monde (sécurité)
        if (usersInThisRoom.length >= 10) {
            socket.emit("room_full");
            socket.leave(roomId);
            return;
        }

        console.log(`🎤 User joined ${roomId}. Peers to connect:`, usersInThisRoom);

        // 5. On envoie la liste au nouvel arrivant pour qu'il initie les appels
        socket.emit("all_users_in_room", usersInThisRoom);
    });

    socket.on("sending_signal", (payload) => {
        // On relaie le signal d'offre (Offer)
        io.to(payload.userToSignal).emit('user_joined_voice', { 
            signal: payload.signal, 
            callerID: payload.callerID 
        });
    });

    socket.on("returning_signal", (payload) => {
        // On relaie le signal de réponse (Answer)
        io.to(payload.callerID).emit('receiving_returned_signal', { 
            signal: payload.signal, 
            id: socket.id 
        });
    });

    socket.on("leave_voice_channel", (roomId: string) => {
        // On quitte la room Socket.IO
        if (roomId) {
            socket.leave(roomId);
            // On prévient les autres qu'on part
            socket.to(roomId).emit("user_left_voice", socket.id);
        }
    });

    socket.on('disconnecting', () => {
        // Gestion automatique du départ lors de la fermeture de l'onglet
        // socket.rooms contient les ID des rooms avant la déconnexion effective
        socket.rooms.forEach((room) => {
            // On ignore la room qui porte le même ID que le socket
            if (room !== socket.id) {
                socket.to(room).emit("user_left_voice", socket.id);
            }
        });
    });
};