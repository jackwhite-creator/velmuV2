import React, { useState, useRef } from 'react';
import { Channel } from '../../store/serverStore';
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

export default function ChatArea({
  activeChannel, messages, isLoadingMore, hasMore, 
  inputValue, showMembers, socket, replyingTo,
  sendMessage, setInputValue, setReplyingTo, 
  onScroll, onUserClick, onToggleMembers
}: Props) {
  
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const scrollToBottomRef = useRef<(() => void) | null>(null);

  const handleSendMessage = async (e: React.FormEvent, file?: File | null) => {
    e.preventDefault();
    if ((!inputValue.trim() && !file) || isSending) return;

    setIsSending(true);
    try {
        await sendMessage(inputValue.trim(), file || undefined, replyingTo?.id);
        setInputValue('');
        setReplyingTo(null);
        
        if (scrollToBottomRef.current) {
            setTimeout(() => {
                scrollToBottomRef.current?.();
            }, 100);
        }
    } catch (err) {
        console.error("Erreur envoi:", err);
    } finally {
        setIsSending(false);
    }
  };

  const performDelete = async () => {
    if (!messageToDelete) return;
    try {
      await api.delete(`/messages/${messageToDelete.id}`);
    } catch (err) {
      console.error("Erreur suppression", err);
    } finally {
      setMessageToDelete(null);
    }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 flex-col bg-slate-900 min-w-0 h-full select-none">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-2xl animate-bounce">👋</div>
        <p>Sélectionnez un salon pour discuter.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-900 relative overflow-hidden">
       <div className="flex-shrink-0 z-30">
         <ChatHeader 
           channel={activeChannel} 
           showMembers={showMembers} 
           onToggleMembers={onToggleMembers} 
         />
       </div>

       {/* ✅ CORRECTION : J'ai retiré la classe 'group' ici ! */}
       {/* Seul le MessageItem doit avoir la classe 'group' */}
       <div className="flex-1 min-h-0 relative">
         <MessageList 
            messages={messages}
            channel={activeChannel}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMore={onScroll} 
            onReply={setReplyingTo}
            onDelete={setMessageToDelete}
            onUserClick={onUserClick}
            onImageClick={setViewingImage}
            onScrollToBottom={(fn) => { scrollToBottomRef.current = fn; }}
         />
       </div>

       <div className="flex-shrink-0 z-20 bg-slate-900">
         <ChatInput 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            socket={socket}
            activeChannel={activeChannel}
            isSending={isSending}
         />
       </div>

       <ConfirmModal 
          isOpen={!!messageToDelete}
          onClose={() => setMessageToDelete(null)}
          onConfirm={performDelete}
          title="Supprimer le message"
          message="Tu es sûr(e) de vouloir supprimer ce message ?"
          isDestructive={true}
          confirmText="Supprimer"
          messageData={messageToDelete}
       />

       <ImageViewerModal 
          imageUrl={viewingImage}
          onClose={() => setViewingImage(null)}
       />
    </div>
  );
}