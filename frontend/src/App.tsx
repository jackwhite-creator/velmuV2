import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import { useServerStore } from './store/serverStore';
import { useFriendStore } from './store/friendStore';
import { useThemeStore } from './store/themeStore';
import { useTitleNotifications } from './hooks/useTitleNotifications';
import api from './lib/api';
import '@livekit/components-styles';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import InvitePage from './pages/InvitePage';
import PatchNotesModal from './components/shared/modals/PatchNotesModal';
import UserProfileModal from './components/server/modals/UserProfileModal';
import GlobalSocketListener from './components/chat/GlobalSocketListener';
import SnowEffect from './components/effects/SnowEffect';
import HeartsEffect from './components/effects/HeartsEffect';
import { PATCH_NOTE_DATA } from './config/patchNotes';
import DeveloperPortal from './pages/DeveloperPortal';
import ApplicationDetail from './pages/ApplicationDetail';
import OAuth2Authorize from './pages/OAuth2Authorize';


function App() {
  const location = useLocation();
  const { token } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const { theme, showHearts } = useThemeStore();

  const { setOnlineUsers, addConversation, setServers, setIsLoaded, isLoaded, setConversations } = useServerStore();
  const { addRequest, updateRequest, removeRequest, setRequests } = useFriendStore(); 

  const [showPatchNotes, setShowPatchNotes] = useState(false);

  useTitleNotifications();

  // Theme Effect
  useEffect(() => {
    document.body.className = ''; // Reset classes
    if (theme === 'light') document.body.classList.add('theme-light');
    if (theme === 'amoled') document.body.classList.add('theme-amoled');
    if (theme === 'christmas') document.body.classList.add('theme-christmas');
    if (theme === 'pink') document.body.classList.add('theme-pink');
    // Default 'dark' has no class
  }, [theme]);

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

    socket.on('online_users_update', (ids: string[]) => {
        // Handle global online users (legacy/fallback)
        setOnlineUsers(ids);
    });

    socket.on('server_online_users', (data: { serverId: string, userIds: string[] }) => {
        // Only merge, do not overwrite via setOnlineUsers
        useServerStore.getState().mergeOnlineUsers(data.userIds);
    });

    socket.on('user_status_change', (data: { userId: string, status: 'online' | 'offline' }) => {
        const { onlineUsers, setOnlineUsers } = useServerStore.getState();
        const newSet = new Set(onlineUsers);
        if (data.status === 'online') newSet.add(data.userId);
        else newSet.delete(data.userId);
        // We need to convert back to array because setOnlineUsers takes array
        setOnlineUsers(Array.from(newSet));
    });

    socket.on('new_conversation', (conv) => { addConversation(conv); refreshConversations(); });
    socket.on('new_friend_request', addRequest);
    socket.on('friend_request_accepted', (req) => updateRequest(req.id, 'ACCEPTED', req));
    socket.on('friend_removed', removeRequest);

    return () => {
      socket.off('conversation_bump');
      socket.off('online_users_update');
      socket.off('server_online_users');
      socket.off('user_status_change');
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
      {theme === 'christmas' && <SnowEffect />}
      {theme === 'pink' && showHearts && <HeartsEffect />}
      <GlobalSocketListener />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:code" element={token ? <InvitePage /> : <Navigate to="/login" />} />
        
        {/* Developer Portal */}
        <Route path="/developers/applications" element={token ? <DeveloperPortal /> : <Navigate to="/login" />} />
        <Route path="/developers/applications/:id" element={token ? <ApplicationDetail /> : <Navigate to="/login" />} />
        <Route path="/oauth2/authorize" element={token ? <OAuth2Authorize /> : <Navigate to="/login" />} />

        <Route path="/channels/:serverId/:channelId?" element={<ChatPage />} />
        <Route path="/" element={<Navigate to={token ? "/channels/@me" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <PatchNotesModal 
        isOpen={showPatchNotes} 
        onClose={handleClosePatchNotes} 
      />

      <UserProfileModal />

    </>
  );
}

export default App;