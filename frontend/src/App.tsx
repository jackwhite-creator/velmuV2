import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import { useServerStore } from './store/serverStore';
import { useFriendStore } from './store/friendStore';
import { useTitleNotifications } from './hooks/useTitleNotifications';
import api from './lib/api';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import InvitePage from './pages/InvitePage';
import PatchNotesModal from './components/PatchNotesModal';
import { PATCH_NOTE_DATA } from './config/patchNotes';

function App() {
  const location = useLocation();
  const { token } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();

  const { setOnlineUsers, addConversation, setServers, setIsLoaded, isLoaded, setConversations } = useServerStore();
  const { addRequest, updateRequest, removeRequest, setRequests } = useFriendStore(); 

  const [showPatchNotes, setShowPatchNotes] = useState(false);

  useTitleNotifications();

  useEffect(() => {
    if (token) connect();
    else disconnect();
    return () => disconnect();
  }, [token, connect, disconnect]);

  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault(); 
    };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  useEffect(() => {
    if (token) {
      setIsLoaded(false);
      
      Promise.all([
        api.get('/friends').then(res => setRequests(res.data)),
        api.get('/servers').then(res => setServers(res.data)),
        api.get('/conversations/me').then(res => setConversations(res.data))
      ])
      .catch((err) => console.error("Erreur chargement initial", err))
      .finally(() => {
          setTimeout(() => setIsLoaded(true), 500);
      });
    } else {
        setIsLoaded(true);
    }
  }, [token, setRequests, setServers, setConversations, setIsLoaded]);

  useEffect(() => {
    if (!socket) return;

    const refreshConversations = () => {
        api.get('/conversations/me').then(res => setConversations(res.data)).catch(console.error);
    };

    socket.on('conversation_bump', (data: { id: string }) => {
        const isOnThisConv = location.pathname.includes(`/channels/@me/${data.id}`);

        if (isOnThisConv) {
            api.post(`/conversations/${data.id}/read`).then(() => {
                refreshConversations();
            });
        } else {
            refreshConversations();
        }
    });

    socket.on('online_users_update', (ids: string[]) => setOnlineUsers(ids));
    socket.on('new_conversation', (conv) => { addConversation(conv); refreshConversations(); });
    socket.on('new_friend_request', addRequest);
    socket.on('friend_request_accepted', (req) => updateRequest(req.id, 'ACCEPTED', req));
    socket.on('friend_removed', removeRequest);

    return () => {
      socket.off('conversation_bump');
      socket.off('online_users_update');
      socket.off('new_conversation');
      socket.off('new_friend_request');
      socket.off('friend_request_accepted');
      socket.off('friend_removed');
    };
  }, [socket, setOnlineUsers, addConversation, addRequest, updateRequest, removeRequest, setConversations, location.pathname]);

  useEffect(() => {
    if (token) {
        const lastSeenVersion = localStorage.getItem('velmu_last_patch_version');
        
        if (lastSeenVersion !== PATCH_NOTE_DATA.versionId) {
            const timer = setTimeout(() => {
                setShowPatchNotes(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }
  }, [token]);

  const handleClosePatchNotes = () => {
      setShowPatchNotes(false);
      localStorage.setItem('velmu_last_patch_version', PATCH_NOTE_DATA.versionId);
  };

  if (token && !isLoaded) {
      return (
        <div className="h-screen w-full bg-[#1e1f22] flex flex-col items-center justify-center text-white gap-4">
            <div className="w-16 h-16 relative flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-t-brand border-zinc-700 rounded-full animate-spin"></div>
                 <img src="/logo.png" alt="V" className="w-8 h-8 object-contain opacity-50" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Chargement de Velmu...</p>
        </div>
      );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:code" element={token ? <InvitePage /> : <Navigate to="/login" />} />
        <Route path="/channels/:serverId/:channelId?" element={<ChatPage />} />
        <Route path="/" element={<Navigate to={token ? "/channels/@me" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <PatchNotesModal 
        isOpen={showPatchNotes} 
        onClose={handleClosePatchNotes} 
      />
    </>
  );
}

export default App;