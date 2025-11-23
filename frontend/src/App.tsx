import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import { useServerStore } from './store/serverStore';
import { useFriendStore } from './store/friendStore';
import api from './lib/api';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import InvitePage from './pages/InvitePage';

function App() {
  const { token } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();

  // ✅ AJOUT : On récupère setServers pour stocker la liste
  const { setOnlineUsers, addConversation, setServers } = useServerStore();
  const { addRequest, updateRequest, removeRequest, setRequests } = useFriendStore(); 

  // 1. GESTION CONNEXION SOCKET
  useEffect(() => {
    if (token) connect();
    else disconnect();
    return () => disconnect();
  }, [token, connect, disconnect]);

  // 2. GESTION CLIC DROIT GLOBAL
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault(); 
    };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  // 3. CHARGEMENT INITIAL DES DONNÉES (API)
  useEffect(() => {
    if (token) {
      // A. Charger les Amis
      api.get('/friends')
         .then((res) => setRequests(res.data))
         .catch((err) => console.error("Erreur chargement amis", err));

      // ✅ B. Charger les Serveurs (C'est ce qui manquait !)
      api.get('/servers')
         .then((res) => setServers(res.data)) // On remplit la sidebar
         .catch((err) => console.error("Erreur chargement serveurs", err));
    }
  }, [token, setRequests, setServers]);

  // 4. ÉCOUTEURS GLOBAUX SOCKET
  useEffect(() => {
    if (!socket) return;

    socket.on('online_users_update', (ids: string[]) => {
        setOnlineUsers(ids);
    });
    
    socket.on('new_conversation', (conv) => addConversation(conv));
    socket.on('new_friend_request', addRequest);
    socket.on('friend_request_accepted', (req) => {updateRequest(req.id, 'ACCEPTED', req);});
    socket.on('friend_removed', removeRequest);

    return () => {
      socket.off('online_users_update');
      socket.off('new_conversation');
      socket.off('new_friend_request');
      socket.off('friend_request_accepted');
      socket.off('friend_removed');
    };
  }, [socket, setOnlineUsers, addConversation, addRequest, updateRequest, removeRequest]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:code" element={token ? <InvitePage /> : <Navigate to="/login" />} />
      <Route path="/channels/:serverId/:channelId?" element={<ChatPage />} />
      <Route path="/" element={<Navigate to={token ? "/channels/@me" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;