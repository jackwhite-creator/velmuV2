import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '../store/socketStore';
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
  replyTo?: { id: string; content: string; user: { username: string } } | null;
  channelId?: string | null;
  conversationId?: string | null;
}

export const useChat = (targetId: string | undefined, isDm: boolean) => {
  const { socket } = useSocketStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const targetIdRef = useRef(targetId);

  useEffect(() => {
    targetIdRef.current = targetId;
  }, [targetId]);

  // Initial Load
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    setIsLoadingMore(false);

    const params = isDm ? { conversationId: targetId } : { channelId: targetId };

    console.log("🚀 [Chat] Chargement initial pour:", targetId);

    api.get('/messages', { params })
      .then((res) => {
        console.log("📥 [Chat] Reçu initial:", res.data.items.length, "messages. NextCursor:", res.data.nextCursor);
        setMessages(res.data.items.reverse());
        setHasMore(!!res.data.nextCursor);
      })
      .catch(err => console.error("❌ [Chat] Erreur load initial:", err))
      .finally(() => setLoading(false));
  }, [targetId, isDm]);

  // Socket Events
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

  // Load More (Scroll Up)
  const loadMore = useCallback(async () => {
    // Debugging conditions
    if (messages.length === 0) return console.log("⚠️ [LoadMore] Bloqué: Pas de messages");
    if (isLoadingMore) return console.log("⚠️ [LoadMore] Bloqué: Déjà en cours");
    if (!hasMore) return console.log("⚠️ [LoadMore] Bloqué: Plus de messages (HasMore=false)");

    console.log("🔄 [LoadMore] Lancement...");
    setIsLoadingMore(true);
    
    const oldestId = messages[0].id; 
    const params = isDm 
      ? { conversationId: targetId, cursor: oldestId } 
      : { channelId: targetId, cursor: oldestId };

    try {
      const res = await api.get('/messages', { params });
      
      console.log("📥 [LoadMore] Reçu:", res.data.items.length, "anciens messages.");

      if (!res.data.nextCursor) {
        console.log("🛑 [LoadMore] Fin de l'historique atteinte.");
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
      console.error('❌ [LoadMore] Erreur API:', err); 
    } finally {
      setIsLoadingMore(false);
    }
  }, [targetId, isDm, isLoadingMore, hasMore, messages]);

  const sendMessage = useCallback(async (content: string, file?: File, replyToId?: string) => {
    if (!targetId) return;

    if (!file) {
      const payload: any = {
        content,
        replyToId,
        ...(isDm ? { conversationId: targetId } : { channelId: targetId })
      };
      return api.post('/messages', payload);
    }

    const formData = new FormData();
    formData.append('file', file); 
    if (content) formData.append('content', content);
    if (replyToId) formData.append('replyToId', replyToId);
    if (isDm) formData.append('conversationId', targetId);
    else formData.append('channelId', targetId);

    return api.post('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }, [targetId, isDm]);

  return { 
    messages, 
    loading, 
    hasMore, 
    loadMore, 
    sendMessage,
    isLoadingMore
  };
};