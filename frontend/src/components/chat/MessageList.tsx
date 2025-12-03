import React, { Fragment, useEffect, useRef, useMemo, useState } from 'react';
import { Message } from '../../hooks/useChat';
import { Channel, useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';

import MessageItem from './MessageItem';
import ChatWelcome from './ui/ChatWelcome';
import ChatSkeleton from './ui/ChatSkeleton';
import NewMessagesDivider from './ui/NewMessagesDivider';

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
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction: (messageId: string, emoji: string) => Promise<void>;
  unreadCount?: number;
}

const DateSeparator = React.memo(({ date }: { date: Date }) => (
  <div className="relative flex items-center justify-center my-6 select-none group px-4">
    <div className="absolute inset-0 flex items-center px-4">
        <div className="w-full border-t border-background-modifier-hover"></div>
    </div>
    <span className="relative bg-background-primary px-2 text-[11px] font-semibold text-text-muted">
        {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
    </span>
  </div>
));

interface ProcessedMessage {
    id: string;
    original: Message;
    shouldGroup: boolean;
    isNewDay: boolean;
    date: Date;
    isSameUser: boolean;
    type: 'message';
}

export default function MessageList({ 
  messages, channel, hasMore, isLoadingMore, loadMore,
  onReply, onDelete, onUserClick, onImageClick,
  onScrollToBottom, onAddReaction, onRemoveReaction,
  unreadCount = 0
}: Props) {
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();
  const isOwner = activeServer?.ownerId === user?.id;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Pre-calculate grouping and dates
  const processedMessages = useMemo(() => {
      const processed: ProcessedMessage[] = [];
      
      for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const previousMsg = messages[i - 1];
          
          if (!msg || !msg.user) continue;

          const dateCurrent = new Date(msg.createdAt);
          const datePrev = previousMsg ? new Date(previousMsg.createdAt) : null;
          
          const isNewDay = !datePrev || (dateCurrent.getDate() !== datePrev.getDate() || dateCurrent.getMonth() !== datePrev.getMonth() || dateCurrent.getFullYear() !== datePrev.getFullYear());
          
          const isSameUser = previousMsg && previousMsg.user.id === msg.user.id;
          const isTimeClose = previousMsg && (dateCurrent.getTime() - datePrev!.getTime() < 60000 * 5);
          
          const isCurrentSystem = msg.type === 'SYSTEM';
          const isPreviousSystem = previousMsg?.type === 'SYSTEM';
          
          const shouldGroup = !!(isSameUser && isTimeClose && !msg.replyTo && !isNewDay && !isCurrentSystem && !isPreviousSystem);

          processed.push({
              id: msg.id,
              original: msg,
              shouldGroup,
              isNewDay,
              date: dateCurrent,
              isSameUser: !!isSameUser,
              type: 'message'
          });
      }
      return processed;
  }, [messages]);

  // Intersection Observer for loading more history
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          // Save current scroll height to restore position after load
          const container = scrollContainerRef.current;
          if (container) {
             const previousScrollHeight = container.scrollHeight;
             const previousScrollTop = container.scrollTop;
             
             loadMore().then(() => {
                 // Restore scroll position logic if needed, 
                 // but with flex-col-reverse, adding items to the "end" (top) 
                 // usually pushes content down, so we might need to adjust scrollTop
                 // However, browsers often handle this well for reverse lists.
                 // Let's verify behavior first.
             });
          } else {
              loadMore();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Expose scrollToBottom to parent
  useEffect(() => {
    if (onScrollToBottom) {
        onScrollToBottom(() => {
            if (scrollContainerRef.current) {
                // Scroll to the bottom of the container (newest messages)
                scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
            }
        });
    }
  }, [onScrollToBottom]);

  // Smart Auto-Scroll:
  // 1. If I send a message: Force scroll to bottom (even if reading history).
  // 2. If I receive a message:
  //    - If I'm at the bottom: Native flex-col-reverse handles it (content pushes up).
  //    - If I'm reading history: Do nothing (don't disturb).
  useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.user?.id === user?.id;

      if (isOwnMessage) {
          // Force scroll to bottom for own messages
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
  }, [messages, user?.id]);

  return (
    <div 
        ref={scrollContainerRef}
        className="flex flex-col-reverse overflow-y-auto h-full custom-scrollbar overscroll-contain"
        style={{ overflowAnchor: 'auto' }} // Enable scroll anchoring
    >
        {/* Bottom Spacer/Anchor */}
        <div className="h-4 flex-shrink-0" />

        {/* Messages (Reversed) */}
        {processedMessages.slice().reverse().map((msgData, index) => {
             // Note: index is reversed too.
             const isLastUnread = index === unreadCount - 1;

             return (
                 <Fragment key={msgData.id}>
                    <MessageItem 
                        msg={msgData.original}
                        isMe={user?.id === msgData.original.user.id}
                        isSameUser={msgData.isSameUser}
                        shouldGroup={msgData.shouldGroup}
                        onReply={onReply}
                        onDelete={() => onDelete(msgData.original)}
                        onUserClick={onUserClick}
                        onReplyClick={(id) => {
                            // Scroll to message logic needs update for non-virtuoso
                            const el = document.getElementById(`message-${id}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        isOwner={isOwner}
                        serverId={activeServer?.id}
                        onImageClick={onImageClick} 
                        onImageLoad={() => {
                            // Optional: auto-scroll if near bottom
                        }}
                        onAddReaction={onAddReaction}
                        onRemoveReaction={onRemoveReaction}
                    />
                    {isLastUnread && <NewMessagesDivider />}
                    {msgData.isNewDay && <DateSeparator date={msgData.date} />}
                 </Fragment>
             );
        })}

        {/* Welcome Message (At the visual top, so end of list) */}
        {!hasMore && (
            <div className="mb-2 mt-auto">
                <ChatWelcome channel={channel} />
            </div>
        )}

        {/* Loading Indicator / Sentinel (At the visual top, so end of list) */}
        {hasMore && (
            <div ref={loadMoreRef} className="py-4 flex justify-center w-full">
                {isLoadingMore && <ChatSkeleton />}
            </div>
        )}
    </div>
  );
}