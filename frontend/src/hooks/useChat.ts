import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '../store/socketStore';
import { useServerStore } from '../store/serverStore'; 
import api from '../lib/api';

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  type: string;
}

export interface Message {
  id: string;
  content: string;
  attachments: Attachment[];
  user: { id: string; username: string; discriminator: string; avatarUrl?: string };
  createdAt: string;
  updatedAt?: string;
  type?: 'DEFAULT' | 'SYSTEM';
  replyTo?: { id: string; content: string; user: { username: string } } | null;
  channelId?: string | null;
  conversationId?: string | null;
  isPending?: boolean;
}

export const useChat = (targetId: string | undefined, isDm: boolean) => {
  const { socket } = useSocketStore();
  const { touchConversation } = useServerStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const targetIdRef = useRef(targetId);

  useEffect(() => {
    targetIdRef.current = targetId;
  }, [targetId]);

  useEffect(() => {
    if (!targetId) {
        setMessages([]);
        return;
    }

    setLoading(true);
    setIsLoadingMore(false);

    const params = isDm ? { conversationId: targetId } : { channelId: targetId };

    api.get('/messages', { params })
      .then((res) => {
        if (targetIdRef.current === targetId) {
            setMessages(res.data.items.reverse());
            setHasMore(!!res.data.nextCursor);
        }
      })
      .catch(err => console.error("Erreur load initial:", err))
      .finally(() => {
        if (targetIdRef.current === targetId) {
            setLoading(false);
        }
      });
  }, [targetId, isDm]);

  useEffect(() => {
    if (!socket || !targetId) return;
    
    const joinEvent = isDm ? 'join_conversation' : 'join_channel';
    const leaveEvent = isDm ? 'leave_conversation' : 'leave_channel';
    
    socket.emit(joinEvent, targetId);

    const handleNewMessage = (msg: Message) => {
      const msgContextId = isDm ? msg.conversationId : msg.channelId;
      if (msgContextId === targetIdRef.current) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev; 
          return [...prev, msg];
        });
      }
    };

    const handleMessageUpdate = (updatedMsg: Message) => {
        setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    };

    const handleMessageDelete = (data: { id: string, channelId?: string, conversationId?: string }) => {
        const ctxId = isDm ? data.conversationId : data.channelId;
        if (ctxId === targetIdRef.current) {
            setMessages((prev) => prev.filter(m => m.id !== data.id));
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdate);
    socket.on('message_deleted', handleMessageDelete);

    return () => {
      socket.emit(leaveEvent, targetId);
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdate);
      socket.off('message_deleted', handleMessageDelete);
    };
  }, [socket, targetId, isDm]);

  const loadMore = useCallback(async () => {
    if (messages.length === 0 || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    const oldestId = messages[0].id; 
    const params = isDm 
      ? { conversationId: targetId, cursor: oldestId } 
      : { channelId: targetId, cursor: oldestId };

    try {
      const res = await api.get('/messages', { params });
      
      if (!res.data.nextCursor) {
        setHasMore(false);
      }
      
      const olderMsgs = res.data.items.reverse();
      
      if (olderMsgs.length > 0) {
        setMessages((prev) => {
          const currentIds = new Set(prev.map(m => m.id));
          const uniqueOlder = olderMsgs.filter((m: Message) => !currentIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
      } else {
        setHasMore(false);
      }
    } catch (err) { 
      console.error('Erreur LoadMore:', err); 
    } finally {
      setIsLoadingMore(false);
    }
  }, [targetId, isDm, isLoadingMore, hasMore, messages]);

  const sendMessage = useCallback(async (content: string, file?: File, replyToId?: string) => {
    if (!targetId) return;

    let res;
    if (!file) {
      const payload: any = {
        content,
        replyToId,
        ...(isDm ? { conversationId: targetId } : { channelId: targetId })
      };
      res = await api.post('/messages', payload);
    } else {
      const formData = new FormData();
      formData.append('file', file); 
      if (content) formData.append('content', content);
      if (replyToId) formData.append('replyToId', replyToId);
      if (isDm) formData.append('conversationId', targetId);
      else formData.append('channelId', targetId);

      res = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    if (isDm) {
        touchConversation(targetId);
    }

    return res;
  }, [targetId, isDm, touchConversation]);

  return { 
    messages, 
    loading, 
    hasMore, 
    loadMore, 
    sendMessage,
    isLoadingMore
  };
};