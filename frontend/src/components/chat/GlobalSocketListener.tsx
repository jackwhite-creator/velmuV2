import { useEffect } from 'react';
import { useSocketStore } from '../../store/socketStore';
import { useServerStore } from '../../store/serverStore';

export default function GlobalSocketListener() {
  const { socket } = useSocketStore();
  const { handleNewMessage } = useServerStore();

  const { activeServer } = useServerStore();

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
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [socket, handleNewMessage]);

  return null;
}
