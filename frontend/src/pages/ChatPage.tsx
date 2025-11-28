import React, { useState, useEffect } from 'react';
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
import MemberList from '../components/server/MemberList';
import UserFooter from '../components/chat/UserFooter';
import FriendsDashboard from '../components/chat/FriendsDashboard';
import GlobalSocketListener from '../components/chat/GlobalSocketListener';

import CreateServerModal from '../components/server/modals/CreateServerModal';
import InviteModal from '../components/server/modals/InviteModal';
import JoinServerModal from '../components/server/modals/JoinServerModal';
import ProfileModal from '../components/user/modals/ProfileModal';
import UserProfileModal from '../components/user/profile/UserProfileModal';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../components/ui/ContextMenu';
import ConfirmModal from '../components/ui/ConfirmModal';

type UserContextMenuData = { x: number; y: number; user: { id: string; username: string; discriminator: string; } };

export default function ChatPage() {
  const { serverId, channelId } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  
  const { 
    servers, activeServer, activeChannel, activeConversation, 
    setActiveServer, updateServer, setActiveChannel, setActiveConversation,
    conversations, getLastChannelId 
  } = useServerStore();
  
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

  // Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleRefreshServer = async (updatedServerId: string) => {
      if (activeServer && activeServer.id === updatedServerId) {
        try {
            const res = await api.get(`/servers/${updatedServerId}`);
            updateServer(res.data);
        } catch (e) { console.error("Erreur refresh", e); }
      }
    };

    const handleMemberAdded = (member: any) => {
        if (activeServer) {
            const sId = member.serverId || activeServer.id;
            useServerStore.getState().addMember(sId, member);
        }
    };

    const handleMemberRemoved = (data: { memberId: string, serverId?: string }) => {
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
    } 
    else if (serverId === '@me') {
        if (activeServer) setActiveServer(null);

        if (channelId) {
            const existing = conversations.find(c => c.id === channelId);
            if (existing) {
                if (activeConversation?.id !== existing.id) setActiveConversation(existing);
            } else {
                api.get(`/conversations/${channelId}`).then(res => setActiveConversation(res.data)).catch(() => navigate('/channels/@me'));
            }
        } else {
            if (activeConversation) setActiveConversation(null);
        }
    }
  }, [serverId, channelId, servers, activeServer, navigate, conversations, setActiveServer, setActiveChannel, setActiveConversation, getLastChannelId]);

  // Join Server Socket Room
  useEffect(() => {
    if (socket && activeServer?.id) {
      socket.emit('join_server', activeServer.id);
    }
  }, [socket, activeServer?.id]);


  const { messages, loading, hasMore, loadMore, sendMessage } = useChat(
    !activeServer ? activeConversation?.id : activeChannel?.id, 
    !activeServer
  );

  const isDmMode = !activeServer;
  const showFriendsDashboard = isDmMode && !activeConversation;
  const effectiveChannel = isDmMode && activeConversation 
    ? { id: activeConversation.id, name: activeConversation.users?.find(u => u.id !== user?.id)?.username || 'Ami', type: 'dm' } 
    : activeChannel;
  
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

  const renderMainContent = () => {
    if (showFriendsDashboard) {
        return <FriendsDashboard onUserContextMenu={handleUserContextMenu} />;
    }

    return (
        <ChatArea
          activeChannel={effectiveChannel || null} 
          messages={messages} 
          isLoadingMore={loading} 
          hasMore={hasMore}
          inputValue={inputValue} setInputValue={setInputValue}
          showMembers={showMembers} onToggleMembers={() => setShowMembers(!showMembers)}
          socket={socket} replyingTo={replyingTo} setReplyingTo={setReplyingTo}
          onScroll={loadMore} 
          onUserClick={handleUserClick} sendMessage={sendMessage}
        />
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#1e1e20] text-zinc-100 overflow-hidden font-sans select-none">
      <GlobalSocketListener />
      
      <ServerRail onOpenCreateServer={() => setIsCreateServerOpen(true)} onOpenJoinServer={() => setIsJoinServerOpen(true)} />

      <div className="w-[240px] bg-[#2b2d31] flex flex-col h-full flex-shrink-0 border-r border-[#1e1f22]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeServer ? (
              <ServerChannels 
                activeServer={activeServer}
                activeChannel={activeChannel}
                socket={socket}
                onInvite={() => setIsInviteOpen(true)}
                onChannelSelect={(c) => navigate(`/channels/${activeServer.id}/${c.id}`)} 
                onOpenProfile={() => setIsSettingsOpen(true)}
              />
            ) : (
              <DMSidebar onUserContextMenu={handleUserContextMenu} /> 
            )}
        </div>
        <div className="flex-shrink-0 bg-[#232428]">
            <UserFooter />
        </div>
      </div>

      <main className="flex-1 flex min-w-0 bg-[#313338] relative shadow-lg z-0 overflow-hidden">
          {renderMainContent()}

          {activeServer && showMembers && !showFriendsDashboard && activeChannel?.type === 'TEXT' && (
            <div className="hidden lg:block w-60 bg-[#2b2d31] border-l border-[#26272d] h-full flex-shrink-0 overflow-y-auto custom-scrollbar">
              <MemberList onUserClick={handleUserClick} />
            </div>
          )}
      </main>

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