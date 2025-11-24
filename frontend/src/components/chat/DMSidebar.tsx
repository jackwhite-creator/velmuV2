import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServerStore, Conversation } from '../../store/serverStore';
import api from '../../lib/api';

interface DMSidebarProps {
  onUserContextMenu: (e: React.MouseEvent, user: any) => void;
}

export default function DMSidebar({ onUserContextMenu }: DMSidebarProps) {
  const { user } = useAuthStore();
  const { 
    conversations, activeConversation, onlineUsers,
    setConversations, setActiveConversation, closeConversation 
  } = useServerStore();
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get('/conversations/me')
      .then(res => setConversations(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getOtherUser = (conversation: Conversation) => {
    return conversation.users.find(u => u.id !== user?.id) || conversation.users[0];
  };

  const DMPlaceholder = ({ animate = false }: { animate?: boolean }) => (
    <div className={`flex items-center gap-3 px-2 py-1 mb-1 ${animate ? 'animate-pulse' : 'opacity-20'}`}>
      <div className="w-8 h-8 bg-background-primary rounded-full flex-shrink-0" />
      <div className="h-3 w-24 bg-background-secondary rounded-sm" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-0 p-2 space-y-1 select-none bg-background-tertiary h-full font-sans text-sm border-r border-background-quaternary">
        
      <div 
        onClick={() => setActiveConversation(null)} 
        className={`flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer mb-4 border transition-all
          ${!activeConversation 
            ? 'bg-background-modifier-selected border-background-secondary text-text-header shadow-sm' 
            : 'bg-transparent border-transparent text-text-muted hover:bg-background-modifier-hover hover:text-text-normal'}
        `}
      >
        <div className="w-5 h-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <span className="font-semibold uppercase tracking-wide text-xs">Amis</span>
      </div>

      <div className="flex justify-between items-center px-2 mb-2 group">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider group-hover:text-text-normal transition-colors">Messages Privés</span>
          <span className="text-text-muted hover:text-text-normal cursor-pointer text-lg leading-none transition-colors">+</span>
      </div>

      {isLoading && (
        <div className="space-y-0.5">
           {[...Array(3)].map((_, i) => <DMPlaceholder key={i} animate={true} />)}
        </div>
      )}

      {!isLoading && conversations.map(conv => {
        const otherUser = getOtherUser(conv);
        const isActive = activeConversation?.id === conv.id;
        const isOnline = onlineUsers.has(otherUser.id);

        return (
          <div 
            key={conv.id}
            onClick={() => setActiveConversation(conv)}
            onContextMenu={(e) => onUserContextMenu(e, otherUser)}
            className={`group flex items-center gap-3 px-2 py-1.5 rounded-sm cursor-pointer transition-all border border-transparent
              ${isActive 
                ? 'bg-background-modifier-selected text-text-header border-background-secondary shadow-sm' 
                : 'text-text-muted hover:bg-background-modifier-hover hover:text-text-normal'}
            `}
          >
            <div className="relative">
                <div className="w-8 h-8 rounded-full bg-background-primary flex items-center justify-center text-text-header font-bold text-xs overflow-hidden border border-background-secondary">
                  {otherUser.avatarUrl ? (
                    <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt={otherUser.username} />
                  ) : (
                    otherUser.username[0].toUpperCase()
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-[2.5px] border-background-tertiary rounded-full ${isOnline ? 'bg-status-green' : 'bg-text-muted'}`}></div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`font-medium text-sm truncate ${isActive ? 'text-text-header' : 'text-text-muted group-hover:text-text-normal'}`}>
                  {otherUser.username}
                </span>
            </div>

            <div 
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-normal transition-opacity p-1 rounded hover:bg-background-modifier-hover"
                onClick={(e) => {
                    e.stopPropagation();
                    closeConversation(conv.id);
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
        );
      })}

      {!isLoading && conversations.length === 0 && (
         <div className="flex flex-col mt-2 opacity-40">
            {[...Array(4)].map((_, i) => <DMPlaceholder key={`ghost-${i}`} animate={false} />)}
            <div className="mt-4 px-2 text-center border-t border-background-secondary pt-4">
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Aucun message</p>
            </div>
         </div>
      )}
    </div>
  );
}