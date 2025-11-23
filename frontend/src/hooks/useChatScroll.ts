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

  // ✅ NOUVEAU : Charger automatiquement si pas assez de contenu pour scroller
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !hasMore) {
      return;
    }

    // Si le contenu ne dépasse pas le conteneur, on charge plus
    const canScroll = container.scrollHeight > container.clientHeight;
    
    console.log('🔍 CHECK AUTO-LOAD:', { 
      canScroll, 
      scrollHeight: container.scrollHeight, 
      clientHeight: container.clientHeight,
      hasMore, 
      messagesLength,
      isLoadingMore,
      isLoadingRef: isLoadingRef.current
    });
    
    // ✅ CORRECTION : On vérifie seulement isLoadingMore du parent, pas isLoadingRef
    if (!canScroll && hasMore && messagesLength > 0 && !isLoadingMore) {
      console.log('🔄 AUTO-LOAD: Pas assez de contenu pour scroller, chargement auto...');
      
      loadMore()
        .then(() => {
          console.log('✅ AUTO-LOAD terminé, nouveaux messages chargés');
        })
        .catch(e => console.error('❌ AUTO-LOAD erreur:', e));
    }
  }, [messagesLength, hasMore, isLoadingMore, loadMore]);

  // ✅ Attacher l'événement scroll avec addEventListener
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // ✅ Throttle pour éviter trop d'appels
    let scrollTimeout: NodeJS.Timeout | null = null;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Mise à jour de la position (toujours faire ça)
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

      // ✅ Débounce le chargement pour éviter le spam
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(async () => {
        // ✅ Zone de trigger plus large (200px au lieu de 100px)
        if (scrollTop < 200 && hasMore && !isLoadingRef.current && !isLoadingMore) {
          console.log('🔄 SCROLL LOAD: Chargement déclenché');
          isLoadingRef.current = true;
          
          try {
            await loadMore();
            console.log('✅ SCROLL LOAD terminé');
          } catch (e) {
            console.error('❌ Erreur chargement:', e);
          } finally {
            // ✅ Délai plus court pour réactivité
            setTimeout(() => {
              isLoadingRef.current = false;
            }, 200);
          }
        }
      }, 50); // Petit délai pour throttle
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

  // ✅ Maintien de position lors du chargement d'anciens messages
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const currentScrollHeight = container.scrollHeight;
    const prevScrollHeight = prevScrollHeightRef.current;
    const prevMessagesLength = prevMessagesLengthRef.current;

    // Si on a chargé de nouveaux messages (anciens en haut)
    if (messagesLength > prevMessagesLength && prevScrollHeight > 0) {
      const heightDiff = currentScrollHeight - prevScrollHeight;
      
      // Si on était pas en bas, on maintient la position
      if (!isAtBottomRef.current && heightDiff > 0) {
        container.scrollTop = container.scrollTop + heightDiff;
      } 
      // ✅ Si on était en bas, on scroll en bas (sans animation pour être instantané)
      else if (isAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('auto'));
      }
    }
    // ✅ Premier chargement - scroll en bas immédiatement
    else if (messagesLength > 0 && prevMessagesLength === 0) {
      requestAnimationFrame(() => scrollToBottom('auto'));
    }
    // ✅ AJOUT : Nouveau message unique = on scroll en bas si on était déjà en bas
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