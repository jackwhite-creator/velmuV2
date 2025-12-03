import React, { useEffect } from 'react';
import { useSocketStore } from '../../store/socketStore';
import { useVoiceStore } from '../../store/voiceStore';
import { useServerStore } from '../../store/serverStore';

export const VoiceConnectionManager: React.FC = () => {
    const { socket } = useSocketStore();
    const { isConnected, currentChannelId, isMuted, isDeafened, isCameraOn, isScreenShareOn } = useVoiceStore();
    const { activeServer } = useServerStore();

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('[VoiceConnectionManager] Socket connected/reconnected');
            
            // If we think we are connected to voice, re-emit join_voice to sync backend
            if (isConnected && currentChannelId && activeServer) {
                console.log('[VoiceConnectionManager] Re-joining voice channel:', currentChannelId);
                
                socket.emit('join_voice', { 
                    channelId: currentChannelId, 
                    serverId: activeServer.id,
                    initialState: { 
                        isMuted, 
                        isDeafened, 
                        isCameraOn, 
                        isScreenShareOn 
                    }
                });
            }
        };

        socket.on('connect', handleConnect);

        // Also run immediately if socket is already connected (e.g. first load)
        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off('connect', handleConnect);
        };
    }, [socket, isConnected, currentChannelId, activeServer, isMuted, isDeafened, isCameraOn, isScreenShareOn]);

    return null; // Headless component
};
