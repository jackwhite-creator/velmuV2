import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Channel, useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { Socket } from 'socket.io-client';
import { Message } from '../../hooks/useChat'; 
import api from '../../lib/api';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import ConfirmModal from '../ui/ConfirmModal';
import ImageViewerModal from '../ImageViewerModal';

interface Props {
  activeChannel: Channel | null;
  messages: Message[];
  isLoadingMore: boolean;
  hasMore: boolean;
  inputValue: string;
  showMembers: boolean;
  socket: Socket | null;
  replyingTo: any;
  sendMessage: (content: string, file?: File, replyToId?: string) => Promise<any>;
  setInputValue: (val: string) => void;
  setReplyingTo: (msg: any) => void;
  onScroll: () => Promise<any>; 
  onUserClick: (e: React.MouseEvent, userId: string) => void;
  onToggleMembers: () => void;
}

const ChatArea = React.memo(function ChatArea({
  activeChannel, messages, isLoadingMore, hasMore, 
  inputValue, showMembers, socket, replyingTo,
  sendMessage, setInputValue, setReplyingTo, 
  onScroll, onUserClick, onToggleMembers
}: Props) {
  
  const { user } = useAuthStore();
  const { markConversationAsRead } = useServerStore();
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // File d'attente locale pour l'affichage optimiste
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  
  const [showSkeleton, setShowSkeleton] = useState(false);
  const scrollToBottomRef = useRef<(() => void) | null>(null);

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
      if (activeChannel && activeChannel.type === 'dm') {
          api.post(`/conversations/${activeChannel.id}/read`).catch(console.error);
          markConversationAsRead(activeChannel.id);
      }
  }, [activeChannel?.id, messages.length]);

  // ✅ CORRECTION MAJEURE : FUSION INTELLIGENTE (DEDUPLICATION)
  // On utilise useMemo pour calculer la liste à afficher À CHAQUE RENDU.
  // Si un message "réel" (messages) correspond à un message "en attente" (pending), on cache le pending.
  // Cela évite le "saut" visuel où les deux messages coexistent pendant 10ms.
  const combinedMessages = useMemo(() => {
    // On filtre les messages en attente qui ont DÉJÀ été reçus via le socket
    const filteredPending = pendingMessages.filter(pending => {
        // On cherche s'il existe un message réel identique reçu récemment
        const isAlreadyReceived = messages.slice(-10).some(real => 
            real.content === pending.content &&
            real.user.id === pending.user.id &&
            // On vérifie que c'est bien le même message (créé dans un intervalle de 5s)
            Math.abs(new Date(real.createdAt).getTime() - new Date(pending.createdAt).getTime()) < 5000
        );
        return !isAlreadyReceived;
    });

    return [...messages, ...filteredPending];
  }, [messages, pendingMessages]);


  const handleSendMessage = async (e: React.FormEvent, file?: File | null) => {
    e.preventDefault();
    if (!inputValue.trim() && !file) return;

    const contentToSend = inputValue.trim();
    const replyToId = replyingTo?.id;

    setInputValue('');
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}-${Math.random()}`; 
    let tempMsg: Message | null = null;

    if (!file && user) {
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
        if (scrollToBottomRef.current) setTimeout(() => { scrollToBottomRef.current?.(); }, 10);
    }

    try {
        await sendMessage(contentToSend, file || undefined, replyToId);
        if (scrollToBottomRef.current) setTimeout(() => { scrollToBottomRef.current?.(); }, 100);
    } catch (err) { 
        console.error("Erreur envoi:", err);
    } finally { 
        if (tempMsg) {
            // On retire le pending message de la liste d'attente
            // Grâce au useMemo ci-dessus, la transition se fera sans saut visuel
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
      <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col bg-[#313338] min-w-0 h-full select-none animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-[#2b2d31] rounded-full flex items-center justify-center mb-4 text-3xl grayscale opacity-50 shadow-inner">
            👋
        </div>
        <p className="text-sm font-medium">Sélectionnez un salon pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#313338] relative overflow-hidden transition-colors duration-200">
       <div className="flex-shrink-0 z-30">
         <ChatHeader channel={activeChannel} showMembers={showMembers} onToggleMembers={onToggleMembers} />
       </div>

       <div className="flex-1 min-h-0 relative">
         <MessageList 
            // ✅ On utilise la liste fusionnée et nettoyée
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
         />
       </div>

       <div className="flex-shrink-0 z-20">
         <ChatInput 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
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