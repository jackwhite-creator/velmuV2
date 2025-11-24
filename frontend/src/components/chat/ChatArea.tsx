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
        if (scrollToBottomRef.current) setTimeout(() => { scrollToBottomRef.current?.(); }, 100);
    } catch (err) { console.error("Erreur envoi:", err); } 
    finally { setIsSending(false); }
  };

  const performDelete = async () => {
    if (!messageToDelete) return;
    try { await api.delete(`/messages/${messageToDelete.id}`); } catch (err) { console.error(err); } 
    finally { setMessageToDelete(null); }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted flex-col bg-background-primary min-w-0 h-full select-none">
        <div className="w-20 h-20 bg-background-secondary rounded-full flex items-center justify-center mb-6 text-4xl grayscale opacity-50">👋</div>
        <p className="text-sm font-medium">Sélectionnez un salon pour commencer.</p>
      </div>
    );
  }

  return (
    // ✅ MIGRATION : bg-background-primary
    <div className="flex-1 flex flex-col h-full min-w-0 bg-background-primary relative overflow-hidden transition-colors duration-200">
       <div className="flex-shrink-0 z-30">
         <ChatHeader channel={activeChannel} showMembers={showMembers} onToggleMembers={onToggleMembers} />
       </div>

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

       <div className="flex-shrink-0 z-20 bg-background-primary">
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
          message="Tu es sûr(e) de vouloir supprimer ce message ? Cette action est irréversible."
          isDestructive={true}
          confirmText="Supprimer"
          messageData={messageToDelete}
       />

       <ImageViewerModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
}