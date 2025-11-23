import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

interface TypingUser {
  userId: string;
  username: string;
  lastUpdate: number;
}

interface Props {
  socket: Socket | null;
  channelId?: string;
  conversationId?: string;
}

export default function TypingIndicator({ socket, channelId, conversationId }: Props) {
  const { user } = useAuthStore();
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());

  useEffect(() => {
    setTypingUsers(new Map());
  }, [channelId, conversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleSnapshot = (data: { channelId?: string, conversationId?: string, users: { userId: string, username: string }[] }) => {
        const isForThisChannel = channelId && data.channelId === channelId;
        const isForThisDm = conversationId && data.conversationId === conversationId;

        if (isForThisChannel || isForThisDm) {
            const newMap = new Map<string, TypingUser>();
            const now = Date.now();
            data.users.forEach(typer => {
                if (typer.userId !== user?.id) {
                    newMap.set(typer.userId, { ...typer, lastUpdate: now });
                }
            });
            setTypingUsers(newMap);
        }
    };

    const handleTypingUpdate = (data: { userId: string, username: string, channelId?: string, conversationId?: string, isTyping: boolean }) => {
      const isForThisChannel = channelId && data.channelId === channelId;
      const isForThisDm = conversationId && data.conversationId === conversationId;

      if ((isForThisChannel || isForThisDm) && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, { userId: data.userId, username: data.username, lastUpdate: Date.now() });
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });
      }
    };
    
    const handleNewMessage = (msg: { user: { id: string }, channelId?: string, conversationId?: string }) => {
      const isForThisChannel = channelId && msg.channelId === channelId;
      const isForThisDm = conversationId && msg.conversationId === conversationId;

      if (isForThisChannel || isForThisDm) {
        setTypingUsers((prev) => {
            if (!prev.has(msg.user.id)) return prev;
            const newMap = new Map(prev);
            newMap.delete(msg.user.id);
            return newMap;
        });
      }
    };
    socket.on('typing_state_snapshot', handleSnapshot);
    socket.on('user_typing', handleTypingUpdate);
    socket.on('new_message', handleNewMessage);

    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        setTypingUsers((prev) => {
            let hasChanges = false;
            const newMap = new Map(prev);
            newMap.forEach((value, key) => {
                if (now - value.lastUpdate > 12000) {
                    newMap.delete(key);
                    hasChanges = true;
                }
            });
            return hasChanges ? newMap : prev;
        });
    }, 2000);

    return () => {
      socket.off('typing_state_snapshot', handleSnapshot);
      socket.off('user_typing', handleTypingUpdate);
      socket.off('new_message', handleNewMessage);
      clearInterval(cleanupInterval);
    };
  }, [socket, channelId, conversationId, user?.id]);


  if (typingUsers.size === 0) return null;

  const usersArray = Array.from(typingUsers.values());

  let content;
  if (usersArray.length === 1) {
    content = (
      <>
        <span className="font-bold text-slate-200">{usersArray[0].username}</span>
        <span className="text-[10px] font-medium text-slate-400 ml-1 opacity-90">est en train d'écrire...</span>
      </>
    );
  } else if (usersArray.length === 2) {
    content = (
      <>
        <span className="font-bold text-slate-200">{usersArray[0].username}</span>
        <span className="text-[10px] text-slate-400 mx-1 opacity-90">et</span>
        <span className="font-bold text-slate-200">{usersArray[1].username}</span>
        <span className="text-[10px] font-medium text-slate-400 ml-1 opacity-90">écrivent...</span>
      </>
    );
  } else {
    content = (
      <>
        <span className="font-bold text-slate-200">Plusieurs personnes</span>
        <span className="text-[10px] font-medium text-slate-400 ml-1 opacity-90">écrivent...</span>
      </>
    );
  }

  const styles = `
    @keyframes bounce-custom {
      0%, 100% { transform: translateY(0); opacity: 0.4; }
      50% { transform: translateY(-3px); opacity: 1; }
    }
    .typing-dot {
      animation: bounce-custom 1.2s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
  `;

  return (
    <div className="
      absolute bottom-full left-4 -mb-2 z-10 
      flex items-center gap-1.5 px-3 py-1.5
      bg-slate-900/95 backdrop-blur-sm
      rounded-t-lg
      border-t border-x border-white/5
      shadow-[0_-4px_12px_rgba(0,0,0,0.5)]
      pointer-events-none select-none
    ">
      <style>{styles}</style>
      <div className="flex items-center gap-0.5 mt-0.5">
        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full typing-dot"></div>
        <div className="w-1.S h-1.5 bg-slate-200 rounded-full typing-dot"></div>
        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full typing-dot"></div>
      </div>
      <div className="text-[10px] flex items-baseline animate-pulse leading-none">
        {content}
      </div>
    </div>
  );
}