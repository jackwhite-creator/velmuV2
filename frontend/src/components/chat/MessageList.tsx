import React, { Fragment, useEffect } from 'react';
import { Message } from '../../hooks/useChat';
import { Channel, useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

import MessageItem from './MessageItem';
import ChatWelcome from './ui/ChatWelcome';
import ChatSkeleton from './ui/ChatSkeleton';

import { useChatScroll } from '../../hooks/useChatScroll';

interface Props {
  messages: Message[];
  channel: Channel;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  onReply: (msg: any) => void;
  onDelete: (msg: Message) => void;
  onUserClick: (e: React.MouseEvent, userId: string) => void;
  onImageClick: (url: string) => void;
  onScrollToBottom?: (fn: () => void) => void;
}

// ✅ NOUVEAU SÉPARATEUR : Fin, épuré, intégré au fond
const DateSeparator = ({ date }: { date: Date }) => (
  <div className="relative flex items-center justify-center my-6 select-none group">
    {/* La ligne */}
    <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800"></div>
    </div>
    {/* Le texte */}
    <span className="relative bg-[#313338] px-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
        {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
    </span>
  </div>
);

export default function MessageList({ 
  messages, channel, hasMore, isLoadingMore, loadMore,
  onReply, onDelete, onUserClick, onImageClick,
  onScrollToBottom
}: Props) {
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();
  const isOwner = activeServer?.ownerId === user?.id;

  const { scrollRef, messagesEndRef, scrollToBottom, isAtBottomRef } = useChatScroll({
    messagesLength: messages.length,
    hasMore,
    loadMore,
    channelId: channel.id,
    isLoadingMore 
  });

  useEffect(() => {
    if (onScrollToBottom) onScrollToBottom(() => scrollToBottom('smooth'));
  }, [onScrollToBottom, scrollToBottom]);

  const handleImageLoad = () => {
    if (isAtBottomRef.current) scrollToBottom('smooth');
  };
  
  const scrollToMessage = (id: string) => {
      const el = document.getElementById(`message-${id}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-zinc-800/80');
          setTimeout(() => el.classList.remove('bg-zinc-800/80'), 1000);
      }
  };

  return (
    <div 
        ref={scrollRef} 
        // Fond Zinc hérité du parent (#313338)
        className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
    >
        <div className="mt-auto pt-4" />

        {!hasMore && !isLoadingMore && (
            <div className="mb-4">
                <ChatWelcome channel={channel} />
            </div>
        )}

        {isLoadingMore && (
            <div className="py-2 space-y-4 mb-2">
                <ChatSkeleton />
                <ChatSkeleton />
            </div>
        )}

        <div className="flex flex-col pb-4">
            {messages.map((msg, index) => {
               if (!msg || !msg.user) return null;
               
               const previousMsg = messages[index - 1];
               const isSameUser = previousMsg && previousMsg.user.id === msg.user.id;
               const isTimeClose = previousMsg && (new Date(msg.createdAt).getTime() - new Date(previousMsg.createdAt).getTime() < 60000 * 5);
               
               const dateCurrent = new Date(msg.createdAt);
               const datePrev = previousMsg ? new Date(previousMsg.createdAt) : null;
               const isNewDay = !datePrev || (dateCurrent.getDate() !== datePrev.getDate());
               const shouldGroup = isSameUser && isTimeClose && !msg.replyTo && !isNewDay;

               return (
                 <Fragment key={msg.id}>
                    {isNewDay && <DateSeparator date={dateCurrent} />}
                    <MessageItem 
                        msg={msg}
                        isMe={user?.id === msg.user.id}
                        isSameUser={isSameUser}
                        shouldGroup={shouldGroup}
                        onReply={onReply}
                        onDelete={() => onDelete(msg)}
                        onUserClick={onUserClick}
                        onReplyClick={scrollToMessage}
                        isOwner={isOwner}
                        serverId={activeServer?.id}
                        onImageClick={onImageClick} 
                        onImageLoad={handleImageLoad}
                    />
                 </Fragment>
               );
            })}
        </div>
        
        <div ref={messagesEndRef} className="h-px w-full flex-shrink-0" />
    </div>
  );
}