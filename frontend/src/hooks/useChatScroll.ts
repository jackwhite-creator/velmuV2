import { useRef, useLayoutEffect, useEffect } from 'react';

interface UseChatScrollProps {
  messagesLength: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  channelId?: string;
  isLoadingMore: boolean;
}

export const useChatScroll = ({ 
  messagesLength, 
  hasMore, 
  loadMore, 
  channelId,
  isLoadingMore 
}: UseChatScrollProps) => {
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isAtBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesLengthRef = useRef(0);
  const isLoadingRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // ✅ AUTO-LOAD SÉCURISÉ
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !hasMore) {
      return;
    }

    const canScroll = container.scrollHeight > container.clientHeight;
    
    // On vérifie isLoadingMore du parent pour ne pas spammer
    if (!canScroll && hasMore && messagesLength > 0 && !isLoadingMore) {
      console.log('🔄 AUTO-LOAD: Pas assez de contenu, chargement auto...');
      
      // 🔥 CORRECTION ICI : On utilise Promise.resolve() pour éviter le crash
      // Si loadMore() renvoie undefined (erreur courante), Promise.resolve le gère sans planter.
      Promise.resolve(loadMore())
        .then(() => {
          console.log('✅ AUTO-LOAD terminé');
        })
        .catch(e => console.error('❌ AUTO-LOAD erreur:', e));
    }
  }, [messagesLength, hasMore, isLoadingMore, loadMore]);

  // ✅ SCROLL LISTENER
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(async () => {
        if (scrollTop < 200 && hasMore && !isLoadingRef.current && !isLoadingMore) {
          console.log('🔄 SCROLL LOAD: Chargement déclenché');
          isLoadingRef.current = true;
          
          try {
            // Ici await gère nativement le undefined, donc pas de crash
            await loadMore();
            console.log('✅ SCROLL LOAD terminé');
          } catch (e) {
            console.error('❌ Erreur chargement:', e);
          } finally {
            setTimeout(() => {
              isLoadingRef.current = false;
            }, 200);
          }
        }
      }, 50);
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [hasMore, isLoadingMore, loadMore]);

  // Reset au changement de channel
  useLayoutEffect(() => {
    isAtBottomRef.current = true;
    isLoadingRef.current = false;
    prevScrollHeightRef.current = 0;
    prevMessagesLengthRef.current = 0;
    scrollToBottom('auto');
    const timeout = setTimeout(() => scrollToBottom('auto'), 100);
    return () => clearTimeout(timeout);
  }, [channelId]);

  // Maintien de position
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const currentScrollHeight = container.scrollHeight;
    const prevScrollHeight = prevScrollHeightRef.current;
    const prevMessagesLength = prevMessagesLengthRef.current;

    if (messagesLength > prevMessagesLength && prevScrollHeight > 0) {
      const heightDiff = currentScrollHeight - prevScrollHeight;
      
      if (!isAtBottomRef.current && heightDiff > 0) {
        container.scrollTop = container.scrollTop + heightDiff;
      } 
      else if (isAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('auto'));
      }
    }
    else if (messagesLength > 0 && prevMessagesLength === 0) {
      requestAnimationFrame(() => scrollToBottom('auto'));
    }
    else if (messagesLength === prevMessagesLength + 1 && prevMessagesLength > 0) {
      if (isAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('auto'));
      }
    }

    prevScrollHeightRef.current = currentScrollHeight;
    prevMessagesLengthRef.current = messagesLength;
  }, [messagesLength]);

  return {
    scrollRef,
    messagesEndRef,
    scrollToBottom,
    isAtBottomRef
  };
};