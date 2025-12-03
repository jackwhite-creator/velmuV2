import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Channel, useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { Socket } from 'socket.io-client';
import { Message } from '../../hooks/useChat'; 
import api from '../../lib/api';
import { prepareMentionsForBackend } from '../../lib/mentionUtils';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import ConfirmModal from '../ui/ConfirmModal';
import ImageViewerModal from '../shared/modals/ImageViewerModal';

interface Props {
  activeChannel: Channel | null;
  messages: Message[];
  isLoadingMore: boolean;
  hasMore: boolean;
  inputValue: string;
  showMembers: boolean;
  socket: Socket | null;
  replyingTo: any;
  sendMessage: (content: string, files?: File[], replyToId?: string) => Promise<any>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setReplyingTo: (msg: any) => void;
  onScroll: () => Promise<any>; 
  onUserClick: (e: React.MouseEvent, userId: string) => void;
  onToggleMembers: () => void;
  onMobileBack?: () => void; 
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction: (messageId: string, emoji: string) => Promise<void>;
}

const ChatArea = React.memo(function ChatArea({
  activeChannel, messages, isLoadingMore, hasMore, 
  inputValue, showMembers, socket, replyingTo,
  sendMessage, setInputValue, setReplyingTo, 
  onScroll, onUserClick, onToggleMembers, onMobileBack,
  onAddReaction, onRemoveReaction
}: Props) {
  
  const { user } = useAuthStore();
  
  // Optimized selectors
  const markConversationAsRead = useServerStore(state => state.markConversationAsRead);
  const activeServer = useServerStore(state => state.activeServer);
  const activeConversation = useServerStore(state => state.activeConversation);

  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  
  const [showSkeleton, setShowSkeleton] = useState(false);
  const scrollToBottomRef = useRef<(() => void) | null>(null);

  // Track initial unread count for the current channel
  const [initialUnreadCount, setInitialUnreadCount] = useState(0);
  const prevChannelIdRef = useRef<string | null>(null);
  const isWindowFocused = useRef(document.hasFocus());

  // Handle window focus/blur
  useEffect(() => {
      const onFocus = () => {
          isWindowFocused.current = true;
          // If we have unread messages when focusing, show the divider
          if (activeChannel?.type === 'dm' && activeConversation && activeConversation.unreadCount > 0) {
              setInitialUnreadCount(activeConversation.unreadCount);
              // Mark as read after a short delay to allow user to see the divider
              setTimeout(() => {
                  if (activeChannel) {
                      api.post(`/conversations/${activeChannel.id}/read`).catch(console.error);
                      markConversationAsRead(activeChannel.id);
                  }
              }, 1000);
          }
      };
      
      const onBlur = () => {
          isWindowFocused.current = false;
      };

      window.addEventListener('focus', onFocus);
      window.addEventListener('blur', onBlur);
      return () => {
          window.removeEventListener('focus', onFocus);
          window.removeEventListener('blur', onBlur);
      };
  }, [activeChannel?.id, activeConversation?.unreadCount]);

  // Update initial unread count when channel changes
  const currentChannelId = activeChannel?.id || null;
  if (currentChannelId !== prevChannelIdRef.current) {
      prevChannelIdRef.current = currentChannelId;
      const count = (activeChannel?.type === 'dm' && activeConversation) ? activeConversation.unreadCount : 0;
      setInitialUnreadCount(count);
  }

  useEffect(() => {
    let timeout: any;
    if (isLoadingMore) {
        timeout = setTimeout(() => setShowSkeleton(true), 150);
    } else {
        setShowSkeleton(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoadingMore]);

  useEffect(() => {
      // Only mark as read if window is focused
      if (activeChannel && activeChannel.type === 'dm' && isWindowFocused.current) {
          api.post(`/conversations/${activeChannel.id}/read`).catch(console.error);
          markConversationAsRead(activeChannel.id);
      }
  }, [activeChannel?.id, messages.length]);

  const combinedMessages = useMemo(() => {
    const filteredPending = pendingMessages.filter(pending => {
        const isAlreadyReceived = messages.slice(-10).some(real => 
            real.content === pending.content &&
            real.user.id === pending.user.id &&
            Math.abs(new Date(real.createdAt).getTime() - new Date(pending.createdAt).getTime()) < 60000
        );
        return !isAlreadyReceived;
    });
    return [...messages, ...filteredPending];
  }, [messages, pendingMessages]);

  const handleSendMessage = async (e: React.FormEvent, files?: File[]) => {
    e.preventDefault();
    if (!inputValue.trim() && (!files || files.length === 0)) return;

    // Clear unread divider when sending a message
    setInitialUnreadCount(0);

    let contentToSend = inputValue.trim();
    
    // Parse mentions: @username -> <@userId>
    let users: any[] = [];
    if (activeChannel?.type === 'dm' && activeConversation) {
        users = activeConversation.users || [];
    } else if (activeServer?.members) {
        users = activeServer.members.map((m: any) => m.user);
    }

    contentToSend = prepareMentionsForBackend(contentToSend, users);

    const replyToId = replyingTo?.id;

    setInputValue('');
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}-${Math.random()}`; 
    let tempMsg: Message | null = null;

    if ((!files || files.length === 0) && user) {
        tempMsg = {
            id: tempId,
            content: contentToSend,
            attachments: [],
            user: {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                avatarUrl: user.avatarUrl || undefined
            },
            createdAt: new Date().toISOString(),
            channelId: activeChannel?.id,
            replyTo: replyingTo ? { id: replyToId, content: replyingTo.content, user: replyingTo.user } : null,
            isPending: true
        };
        setPendingMessages(prev => [...prev, tempMsg!]);
        // Note: We rely on MessageList's followOutput to scroll to bottom
    }

    try {
        await sendMessage(contentToSend, files, replyToId);
    } catch (err) { 
        console.error("Erreur envoi:", err);
    } finally { 
        if (tempMsg) {
            setPendingMessages(prev => prev.filter(m => m.id !== tempId));
        }
    }
  };

  const performDelete = async () => {
    if (!messageToDelete) return;
    try { await api.delete(`/messages/${messageToDelete.id}`); } catch (err) { console.error(err); } 
    finally { setMessageToDelete(null); }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col bg-primary min-w-0 h-full select-none animate-in fade-in duration-300 relative">
        {/* Bouton Menu Mobile si pas de channel */}
        <div className="absolute top-4 left-4 md:hidden">
            <button onClick={onMobileBack} className="text-text-muted hover:text-white p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
        </div>
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 text-3xl grayscale opacity-50 shadow-inner">
            👋
        </div>
        <p className="text-sm font-medium">Sélectionnez un salon pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-primary relative overflow-hidden transition-colors duration-200">
       <div className="flex-shrink-0 z-30">
         <ChatHeader 
            channel={activeChannel} 
            showMembers={showMembers} 
            onToggleMembers={onToggleMembers} 
            onMobileBack={onMobileBack} 
         />
       </div>

       <div className="flex-1 min-h-0 relative">
         <MessageList 
            messages={combinedMessages}
            channel={activeChannel}
            hasMore={hasMore}
            isLoadingMore={showSkeleton}
            loadMore={onScroll} 
            onReply={setReplyingTo}
            onDelete={setMessageToDelete}
            onUserClick={onUserClick}
            onImageClick={setViewingImage}
            onScrollToBottom={(fn) => { scrollToBottomRef.current = fn; }}
            onAddReaction={onAddReaction}
            onRemoveReaction={onRemoveReaction}
            unreadCount={initialUnreadCount}
         />
       </div>

       <div className="flex-shrink-0 z-20">
         <ChatInput 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={(e, files) => handleSendMessage(e, files)}
            onSendGif={(url) => sendMessage(url)}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            socket={socket}
            activeChannel={activeChannel}
         />
       </div>

       <ConfirmModal 
          isOpen={!!messageToDelete} onClose={() => setMessageToDelete(null)} onConfirm={performDelete}
          title="Supprimer le message" message="Tu es sûr(e) de vouloir supprimer ce message ? Cette action est irréversible."
          isDestructive={true} confirmText="Supprimer" messageData={messageToDelete}
       />

       <ImageViewerModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}, (prevProps, nextProps) => {
    return (
        prevProps.activeChannel?.id === nextProps.activeChannel?.id &&
        prevProps.messages === nextProps.messages &&
        prevProps.isLoadingMore === nextProps.isLoadingMore &&
        prevProps.showMembers === nextProps.showMembers &&
        prevProps.inputValue === nextProps.inputValue &&
        prevProps.replyingTo === nextProps.replyingTo
    );
});

export default ChatArea;