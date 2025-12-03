import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketStore } from '../../store/socketStore';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useVoiceStore } from '../../store/voiceStore';
import SoundManager from '../../utils/SoundManager';

export default function GlobalSocketListener() {
  const { socket } = useSocketStore();
  const { handleNewMessage } = useServerStore();
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();
  const navigate = useNavigate();

  // Ensure we join the server room when active server changes
  useEffect(() => {
      if (socket && activeServer) {
          socket.emit('join_server', activeServer.id);
      }
  }, [socket, activeServer]);

  useEffect(() => {
    if (!socket) return;

    const onDmNotification = (message: any) => {
      handleNewMessage(message);

      // Sound Notification Logic
      const currentActiveConversation = useServerStore.getState().activeConversation;
      const isLookingAtChat = currentActiveConversation?.id === message.conversationId;
      const areSoundsEnabled = useSettingsStore.getState().notifications.enableSounds;

      if (message.conversationId && message.userId !== user?.id && !isLookingAtChat && areSoundsEnabled) {
        SoundManager.playNotification();
      }
    };

    const onChannelMessage = (message: any) => {
        // If it's a DM (has conversationId), we ignore it here because it's handled by dm_notification
        if (message.conversationId) {
            return;
        }
        
        handleNewMessage(message);
    };

    const onKickedFromServer = (data: { serverId: string }) => {
        const currentActiveServer = useServerStore.getState().activeServer;
        if (currentActiveServer?.id === data.serverId) {
            // Redirect to home if currently on that server
            navigate('/channels/@me');
        }
        // Also refresh server list
        useServerStore.getState().fetchServers();
    };

    const onVoiceStateUpdate = (data: any) => {
        // data: { userId, channelId, isMuted, isDeafened, ... }
        const { setParticipantState, updateParticipants } = useVoiceStore.getState();
        
        // Update participant list logic
        if (data.channelId) {
            updateParticipants(data.channelId, data.userId, 'join');
        } else if (data.previousChannelId) {
            updateParticipants(data.previousChannelId, data.userId, 'leave');
        }

        // Update state only if user is in a channel (not on leave)
        if (data.channelId) {
            setParticipantState(data.userId, {
                isMuted: data.isMuted,
                isDeafened: data.isDeafened,
                isCameraOn: data.isCameraOn,
                isScreenShareOn: data.isScreenShareOn
            });
        }
    };

    const onServerVoiceStates = (data: { serverId: string, states: any[] }) => {
        const { setParticipantState, updateParticipants } = useVoiceStore.getState();
        
        data.states.forEach(state => {
            if (state.channelId) {
                updateParticipants(state.channelId, state.userId, 'join');
                setParticipantState(state.userId, {
                    isMuted: state.isMuted,
                    isDeafened: state.isDeafened,
                    isCameraOn: state.isCameraOn,
                    isScreenShareOn: state.isScreenShareOn
                });
            }
        });
    };

    socket.on('new_message', onChannelMessage);
    socket.on('dm_notification', onDmNotification);
    socket.on('kicked_from_server', onKickedFromServer);
    socket.on('voice_state_update', onVoiceStateUpdate);
    socket.on('server_voice_states', onServerVoiceStates);

    return () => {
      socket.off('new_message', onChannelMessage);
      socket.off('dm_notification', onDmNotification);
      socket.off('kicked_from_server', onKickedFromServer);
      socket.off('voice_state_update', onVoiceStateUpdate);
      socket.off('server_voice_states', onServerVoiceStates);
    };
  }, [socket, handleNewMessage, user, navigate]);

  return null;
}
