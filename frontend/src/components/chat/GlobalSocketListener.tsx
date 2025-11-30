import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketStore } from '../../store/socketStore';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
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

    const onNewMessage = (message: any) => {
      handleNewMessage(message);

      // Sound Notification Logic
      const currentActiveConversation = useServerStore.getState().activeConversation;
      const isLookingAtChat = currentActiveConversation?.id === message.conversationId;
      const areSoundsEnabled = useSettingsStore.getState().notifications.enableSounds;

      if (message.conversationId && message.userId !== user?.id && !isLookingAtChat && areSoundsEnabled) {
        SoundManager.playNotification();
      }
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

    socket.on('new_message', onNewMessage);
    socket.on('kicked_from_server', onKickedFromServer);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('kicked_from_server', onKickedFromServer);
    };
  }, [socket, handleNewMessage, user, navigate]);

  return null;
}
