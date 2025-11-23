import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useFriendStore } from '../store/friendStore';
import { useChat } from '../hooks/useChat';
import api from '../lib/api';

import ServerRail from '../components/navigation/ServerRail';
import ServerChannels from '../components/navigation/ServerChannels';
import DMSidebar from '../components/chat/DMSidebar';
import ChatArea from '../components/chat/ChatArea';
import MemberList from '../components/MemberList';
import UserFooter from '../components/chat/UserFooter';
import FriendsDashboard from '../components/chat/FriendsDashboard';

import CreateServerModal from '../components/CreateServerModal';
import InviteModal from '../components/InviteModal';
import JoinServerModal from '../components/JoinServerModal';
import ProfileModal from '../components/ProfileModal';
import UserProfileModal from '../components/UserProfileModal';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../components/ui/ContextMenu';
import ConfirmModal from '../components/ui/ConfirmModal';

type UserContextMenuData = { x: number; y: number; user: { id: string; username: string; discriminator: string; } };

export default function ChatPage() {
  const { serverId, channelId } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const { activeServer, activeChannel, activeConversation, setActiveServer, setActiveChannel } = useServerStore();
  const { requests, removeRequest, addRequest } = useFriendStore();

  const [showMembers, setShowMembers] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);

  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinServerOpen, setIsJoinServerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<string | null>(null);
  
  const [userMenu, setUserMenu] = useState<UserContextMenuData | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<{ id: string; username: string; } | null>(null);

  // 👇 CORRECTION : On retire les refs de scroll d'ici car elles sont gérées dans MessageList via le hook
  // const scrollRef = useRef<HTMLDivElement>(null);
  // const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket && activeServer?.id) {
      socket.emit('join_server', activeServer.id);
    }
  }, [socket, activeServer?.id]);

  useEffect(() => {
    if (!socket) return;
    const handleRefreshServer = (updatedServerId: string) => {
      if (activeServer && activeServer.id === updatedServerId) {
        api.get(`/servers/${updatedServerId}`).then(res => setActiveServer(res.data)).catch(console.error);
      }
    };
    socket.on('refresh_server_ui', handleRefreshServer);
    return () => { socket.off('refresh_server_ui', handleRefreshServer); };
  }, [socket, activeServer, setActiveServer]);

  useEffect(() => {
    if (serverId && serverId !== '@me') {
      if (!activeServer || activeServer.id !== serverId || !activeServer.categories) {
        api.get(`/servers/${serverId}`).then((res) => {
            const serverData = res.data;
            setActiveServer(serverData);
            if (!channelId && serverData.categories?.[0]?.channels?.[0]) {
               navigate(`/channels/${serverId}/${serverData.categories[0].channels[0].id}`);
            }
          }).catch(() => navigate('/channels/@me')); 
      }
    } else if (serverId === '@me') {
        if (activeServer) setActiveServer(null);
    }
  }, [serverId, activeServer, setActiveServer, navigate, channelId]);

  useEffect(() => {
    if (activeServer && channelId) {
        const channel = activeServer.categories?.flatMap(c => c.channels).find(c => c.id === channelId);
        if (channel && activeChannel?.id !== channel.id) setActiveChannel(channel);
    }
  }, [channelId, activeServer, setActiveChannel, activeChannel]);

  const { messages, loading, hasMore, loadMore, sendMessage } = useChat(
    !activeServer ? activeConversation?.id : activeChannel?.id, 
    !activeServer
  );

  const isDmMode = !activeServer;
  const showFriendsDashboard = isDmMode && !activeConversation;
  const effectiveChannel = isDmMode && activeConversation ? { id: activeConversation.id, name: activeConversation.users.find(u => u.id !== user?.id)?.username || 'Ami', type: 'dm' } : activeChannel;
  
  // ❌ SUPPRESSION : On retire handleScroll qui faisait conflit avec le hook
  /* const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && hasMore && !loading) {
      const oldHeight = scrollRef.current.scrollHeight;
      loadMore().then(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - oldHeight; });
    }
  }; 
  */
  
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); 
    setViewingUserProfile(userId);
  };
  
  const openSettingsFromProfile = () => {
    setViewingUserProfile(null);
    setIsSettingsOpen(true);
  };

 const handleSendRequest = async () => {
    if (!userMenu) return;
    try {
      const res = await api.post('/friends/request', { 
        username: userMenu.user.username,
        discriminator: userMenu.user.discriminator
      });
      addRequest(res.data);
    } catch (err: any) {
      console.error("Erreur ajout ami", err);
    } finally {
      setUserMenu(null);
    }
  };

  const handleUserContextMenu = (e: React.MouseEvent, targetUser: { id: string; username: string; discriminator: string; }) => {
    e.preventDefault();
    setUserMenu({ x: e.clientX, y: e.clientY, user: targetUser });
  };
  
  const handleRemoveFriend = () => {
    if (!userMenu) return;
    setFriendToDelete(userMenu.user);
    setConfirmRemoveOpen(true);
    setUserMenu(null);
  };
  
  const performRemoveFriend = async () => {
    if (!friendToDelete) return;
    const request = requests.find(r => (r.senderId === user?.id && r.receiverId === friendToDelete.id) || (r.senderId === friendToDelete.id && r.receiverId === user?.id));
    if (!request) return;
    
    removeRequest(request.id);
    try { await api.delete(`/friends/${request.id}`); } 
    catch(err) { console.error(err); }
    
    setFriendToDelete(null);
  };

  const handleCloseConfirm = () => {
    setConfirmRemoveOpen(false);
    setFriendToDelete(null);
  };

  const isFriend = userMenu && requests.some(
    req => req.status === 'ACCEPTED' && 
           ((req.senderId === user?.id && req.receiverId === userMenu.user.id) || 
            (req.receiverId === user?.id && req.senderId === userMenu.user.id))
  );

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      
      <ServerRail onOpenCreateServer={() => setIsCreateServerOpen(true)} onOpenJoinServer={() => setIsJoinServerOpen(true)} />

      <div className="w-60 bg-slate-800 flex flex-col h-full border-r border-slate-900/50 flex-shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeServer ? (
              <ServerChannels 
                activeServer={activeServer}
                activeChannel={activeChannel}
                socket={socket}
                onInvite={() => setIsInviteOpen(true)}
                onChannelSelect={(c) => navigate(`/channels/${activeServer.id}/${c.id}`)} 
              />
            ) : (
              <DMSidebar onUserContextMenu={handleUserContextMenu} /> 
            )}
        </div>
        <div className="flex-shrink-0">
            <UserFooter />
        </div>
      </div>

      {showFriendsDashboard ? (
        <FriendsDashboard onUserContextMenu={handleUserContextMenu} />
      ) : (
        <main className="flex-1 flex min-w-0 bg-slate-700 relative shadow-lg z-0 overflow-hidden">
          <ChatArea
            activeChannel={effectiveChannel || null} 
            messages={messages} isLoadingMore={loading} hasMore={hasMore}
            inputValue={inputValue} setInputValue={setInputValue}
            showMembers={showMembers} onToggleMembers={() => setShowMembers(!showMembers)}
            socket={socket} replyingTo={replyingTo} setReplyingTo={setReplyingTo}
            
            // 👇 CORRECTION : On passe directement loadMore ici !
            onScroll={loadMore} 
            
            // onScroll={handleScroll} <--- Ancien code
            // scrollRef={scrollRef} messagesEndRef={messagesEndRef} <--- Plus besoin de passer les refs
            
            onUserClick={handleUserClick} sendMessage={sendMessage}
          />
          {activeServer && showMembers && (
            <div className="hidden lg:block w-60 bg-slate-800 border-l border-slate-900/50 h-full flex-shrink-0 overflow-y-auto custom-scrollbar">
              <MemberList onUserClick={handleUserClick} />
            </div>
          )}
        </main>
      )}

      <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setIsCreateServerOpen(false)} />
      <JoinServerModal isOpen={isJoinServerOpen} onClose={() => setIsJoinServerOpen(false)} />
      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} server={activeServer} />
      <ProfileModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {viewingUserProfile && <UserProfileModal userId={viewingUserProfile} onClose={() => setViewingUserProfile(null)} onOpenSettings={openSettingsFromProfile} />}
      
      {userMenu && (
        <ContextMenu position={userMenu} onClose={() => setUserMenu(null)}>
            <ContextMenuItem label="Profil" onClick={() => { setViewingUserProfile(userMenu.user.id); setUserMenu(null); }} />
            <ContextMenuItem label="Copier Pseudo" onClick={() => { navigator.clipboard.writeText(`${userMenu.user.username}#${userMenu.user.discriminator}`); setUserMenu(null); }} />
            
            {user?.id !== userMenu.user.id && (
              <>
                <ContextMenuSeparator />
                {isFriend ? (
                  <ContextMenuItem label="Retirer l'ami" variant="danger" onClick={handleRemoveFriend} />
                ) : (
                  <ContextMenuItem label="Ajouter en ami" onClick={handleSendRequest} />
                )}
              </>
            )}
        </ContextMenu>
      )}

      <ConfirmModal
        isOpen={confirmRemoveOpen}
        onClose={handleCloseConfirm}
        onConfirm={performRemoveFriend}
        title={`Retirer ${friendToDelete?.username}`}
        message={`Es-tu sûr de vouloir retirer ${friendToDelete?.username} de ta liste d'amis ?`}
        isDestructive={true}
        confirmText="Retirer l'ami"
      />
    </div>
  );
}