import React, { useState } from 'react';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useChat } from '../hooks/useChat';

import ServerRail from '../components/navigation/ServerRail';
import ServerChannels from '../components/navigation/ServerChannels';
import DMSidebar from '../components/chat/DMSidebar';
import ChatArea from '../components/chat/ChatArea';
import MemberList from '../components/server/MemberList';
import UserFooter from '../components/chat/UserFooter';
import FriendsDashboard from '../components/chat/FriendsDashboard';
import { VoiceConnectionPanel } from '../components/voice/VoiceConnectionPanel';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceStore } from '../store/voiceStore';
import { VoiceChannelView } from '../components/voice/VoiceChannelView';


import { useChatPageSocket } from '../hooks/useChatPageSocket';
import { useChatPageNavigation } from '../hooks/useChatPageNavigation';
import { useChatPageModals } from '../hooks/useChatPageModals';
import ChatPageModals from '../components/chat/ChatPageModals';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const { token, isMuted } = useVoiceStore();
  
  const { 
    activeServer, activeChannel, activeConversation, setActiveChannel
  } = useServerStore();
  
  // Custom Hooks for logic separation
  useChatPageSocket();
  useChatPageNavigation();
  const modals = useChatPageModals();

  const [showMembers, setShowMembers] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);

  const { messages, loading, hasMore, loadMore, sendMessage, addReaction, removeReaction } = useChat(
    !activeServer ? activeConversation?.id : activeChannel?.id, 
    !activeServer
  );

  const isDmMode = !activeServer;
  const showFriendsDashboard = isDmMode && !activeConversation;
  
  // Determine effective channel for ChatArea
  const effectiveChannel = isDmMode && activeConversation 
    ? { id: activeConversation.id, name: activeConversation.users?.find(u => u.id !== user?.id)?.username || 'Ami', type: 'dm' } 
    : activeChannel;
  
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); 
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    modals.setMiniProfileUser({ 
      userId, 
      anchorRect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      source: 'chat' // Default to chat, MemberList will override this
    });
  };

  const handleUserContextMenu = (e: React.MouseEvent, targetUser: { id: string; username: string; discriminator: string; }) => {
    e.preventDefault();
    modals.setUserMenu({ x: e.clientX, y: e.clientY, user: targetUser });
  };

  const renderMainContent = () => {
    if (showFriendsDashboard) {
        return <FriendsDashboard onUserContextMenu={handleUserContextMenu} />;
    }

    if (activeChannel?.type === 'AUDIO' || activeChannel?.type === 'VIDEO') {
        return <VoiceChannelView onUserContextMenu={handleUserContextMenu} channelId={activeChannel.id} />;
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
          onUserClick={handleUserClick} sendMessage={async (content, files, replyToId) => {
            await sendMessage(content, files, replyToId);
          }}
          onAddReaction={addReaction}
          onRemoveReaction={removeReaction}
        />
    );
  };

  return (
    <LiveKitRoom
      token={token || undefined}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7880"}
      connect={!!token}
      audio={!isMuted}
      onDisconnected={(reason) => console.log('LiveKit disconnected:', reason)}
      data-lk-theme="default"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* RoomAudioRenderer handles audio playback without UI */}
      <RoomAudioRenderer />
      
    <div className="flex-1 flex w-full bg-background-tertiary text-text-normal overflow-hidden font-sans select-none">

      <ServerRail 
        onOpenCreateServer={() => modals.setIsCreateServerOpen(true)} 
        onOpenJoinServer={() => modals.setIsJoinServerOpen(true)} 
      />

      <div className="w-[240px] bg-background-secondary flex flex-col h-full flex-shrink-0 border-r border-background-tertiary">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeServer ? (
              <ServerChannels 
                activeServer={activeServer}
                activeChannel={activeChannel}
                socket={socket}
                onInvite={() => modals.setIsInviteOpen(true)}
                onChannelSelect={setActiveChannel}
                onOpenProfile={() => modals.setIsSettingsOpen(true)}
              />
            ) : (
              <DMSidebar 
                onUserContextMenu={handleUserContextMenu}
              />
            )}
        </div>
        <VoiceConnectionPanel />
        <UserFooter />
      </div>

      <main className="flex-1 flex min-w-0 bg-background-primary relative shadow-lg z-0 overflow-hidden">
          {renderMainContent()}

          {activeServer && showMembers && !showFriendsDashboard && activeChannel?.type === 'TEXT' && (
            <div className="hidden lg:block w-60 bg-background-secondary border-l border-background-tertiary h-full flex-shrink-0 overflow-y-auto custom-scrollbar">
              <MemberList 
                onUserClick={(e, userId) => {
                  e.stopPropagation();
                  const target = e.currentTarget as HTMLElement;
                  const rect = target.getBoundingClientRect();
                  modals.setMiniProfileUser({
                    userId,
                    anchorRect: {
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: rect.height
                    },
                    source: 'member_list'
                  });
                }} 
              />
            </div>
          )}
      </main>

      <ChatPageModals modals={modals} />
    </div>
    </LiveKitRoom>
  );
}