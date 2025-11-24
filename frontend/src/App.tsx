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

  const { setOnlineUsers, addConversation, setServers, setIsLoaded, isLoaded } = useServerStore();
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
      setIsLoaded(false); // On commence le chargement
      
      Promise.all([
        api.get('/friends').then(res => setRequests(res.data)),
        api.get('/servers').then(res => setServers(res.data)),
        api.get('/conversations/me') // On précharge les convs aussi pour éviter les bugs de redirection
      ])
      .catch((err) => console.error("Erreur chargement initial", err))
      .finally(() => {
          // Une fois TOUT chargé, on ouvre les vannes
          setTimeout(() => setIsLoaded(true), 500); // Petit délai pour éviter le flash
      });
    } else {
        setIsLoaded(true); // Si pas connecté, on est "prêt" à afficher le login
    }
  }, [token, setRequests, setServers, setIsLoaded]);

  // 4. ÉCOUTEURS GLOBAUX SOCKET
  useEffect(() => {
    if (!socket) return;

    socket.on('online_users_update', (ids: string[]) => setOnlineUsers(ids));
    socket.on('new_conversation', (conv) => addConversation(conv));
    socket.on('new_friend_request', addRequest);
    socket.on('friend_request_accepted', (req) => updateRequest(req.id, 'ACCEPTED', req));
    socket.on('friend_removed', removeRequest);

    return () => {
      socket.off('online_users_update');
      socket.off('new_conversation');
      socket.off('new_friend_request');
      socket.off('friend_request_accepted');
      socket.off('friend_removed');
    };
  }, [socket, setOnlineUsers, addConversation, addRequest, updateRequest, removeRequest]);

  // ✅ ECRAN DE CHARGEMENT : Si connecté mais pas encore chargé, on affiche un spinner
  if (token && !isLoaded) {
      return (
        <div className="h-screen w-full bg-[#1e1f22] flex flex-col items-center justify-center text-white gap-4">
            <div className="w-16 h-16 relative flex items-center justify-center">
                 {/* Logo simple animé ou spinner */}
                 <div className="absolute inset-0 border-4 border-t-brand border-zinc-700 rounded-full animate-spin"></div>
                 <img src="/logo.png" alt="V" className="w-8 h-8 object-contain opacity-50" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Chargement de Velmu...</p>
        </div>
      );
  }

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