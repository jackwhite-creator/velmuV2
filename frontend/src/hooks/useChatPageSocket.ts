import { useEffect } from 'react';
import { useServerStore } from '../store/serverStore';
import { useSocketStore } from '../store/socketStore';
import api from '../lib/api';

/**
 * Hook to manage server-related socket events
 */
export function useChatPageSocket() {
  const { socket } = useSocketStore();
  const { activeServer, updateServer } = useServerStore();

  useEffect(() => {
    if (!socket) return;

    const handleRefreshServer = async (updatedServerId: string) => {
      if (activeServer && activeServer.id === updatedServerId) {
        try {
          const res = await api.get(`/servers/${updatedServerId}`);
          updateServer(res.data);
        } catch (e) {
          console.error("Erreur refresh", e);
        }
      }
    };

    const handleMemberAdded = (member: any) => {
      if (activeServer) {
        const sId = member.serverId || activeServer.id;
        useServerStore.getState().addMember(sId, member);
      }
    };

    const handleMemberRemoved = (data: { memberId: string; serverId?: string }) => {
      if (activeServer) {
        useServerStore.getState().removeMember(activeServer.id, data.memberId);
      }
    };

    const handleMemberUpdated = (member: any) => {
      if (activeServer) {
        const sId = member.serverId || activeServer.id;
        useServerStore.getState().updateMember(sId, member);
      }
    };

    socket.on('refresh_server_ui', handleRefreshServer);
    socket.on('member_added', handleMemberAdded);
    socket.on('member_removed', handleMemberRemoved);
    socket.on('member_updated', handleMemberUpdated);

    return () => {
      socket.off('refresh_server_ui', handleRefreshServer);
      socket.off('member_added', handleMemberAdded);
      socket.off('member_removed', handleMemberRemoved);
      socket.off('member_updated', handleMemberUpdated);
    };
  }, [socket, activeServer, updateServer]);

  // Join server socket room
  useEffect(() => {
    if (socket && activeServer?.id) {
      socket.emit('join_server', activeServer.id);
    }
  }, [socket, activeServer?.id]);
}
