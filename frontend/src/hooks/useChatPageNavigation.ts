import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServerStore } from '../store/serverStore';
import api from '../lib/api';

/**
 * Hook to manage server/channel navigation logic
 */
export function useChatPageNavigation() {
  const { serverId, channelId } = useParams();
  const navigate = useNavigate();
  
  const {
    servers,
    activeServer,
    activeChannel,
    activeConversation,
    setActiveServer,
    setActiveChannel,
    setActiveConversation,
    conversations,
    getLastChannelId
  } = useServerStore();

  // Server/Channel Navigation Logic
  useEffect(() => {
    if (serverId && serverId !== '@me') {
      const targetServer = servers.find(s => s.id === serverId);
      
      if (targetServer) {
        if (activeServer?.id !== targetServer.id) {
          setActiveServer(targetServer);
        }
      }

      if (activeServer?.id === serverId) {
        if (channelId) {
          const channel = activeServer.categories?.flatMap(c => c.channels).find(c => c.id === channelId);
          if (channel && activeChannel?.id !== channel.id) {
            setActiveChannel(channel);
          }
        } else {
          const lastId = getLastChannelId(activeServer.id);
          const allChannels = activeServer.categories?.flatMap(c => c.channels || []) || [];
          const targetChannel = allChannels.find(c => c.id === lastId) || allChannels[0];
          
          if (targetChannel) {
            navigate(`/channels/${serverId}/${targetChannel.id}`, { replace: true });
          }
        }
      }
    } else if (serverId === '@me') {
      if (activeServer) setActiveServer(null);

      if (channelId) {
        const existing = conversations.find(c => c.id === channelId);
        if (existing) {
          if (activeConversation?.id !== existing.id) setActiveConversation(existing);
        } else {
          api.get(`/conversations/${channelId}`)
            .then(res => setActiveConversation(res.data))
            .catch(() => navigate('/channels/@me'));
        }
      } else {
        if (activeConversation) setActiveConversation(null);
      }
    }
  }, [
    serverId,
    channelId,
    servers,
    activeServer,
    navigate,
    conversations,
    setActiveServer,
    setActiveChannel,
    setActiveConversation,
    getLastChannelId,
    activeChannel,
    activeConversation
  ]);
}
