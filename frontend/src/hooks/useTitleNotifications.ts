import { useEffect, useRef } from 'react';
import { useServerStore } from '../store/serverStore';
import { useFriendStore } from '../store/friendStore';
import { useAuthStore } from '../store/authStore';

const ORIGINAL_TITLE = 'Velmu';

export const useTitleNotifications = () => {
  const { conversations } = useServerStore();
  const { requests } = useFriendStore();
  const { user } = useAuthStore();
  
  const originalTitleRef = useRef(document.title || ORIGINAL_TITLE);

  useEffect(() => {
    if (!user) {
      document.title = originalTitleRef.current;
      return;
    }

    const unreadMessagesCount = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    const pendingFriendsCount = requests.filter(r => r.status === 'PENDING' && r.receiverId === user.id).length;
    
    const totalNotifications = unreadMessagesCount + pendingFriendsCount;

    if (totalNotifications > 0) {
      const displayCount = totalNotifications > 9 ? '9+' : totalNotifications;
      document.title = `(${displayCount}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }

  }, [conversations, requests, user]);
};