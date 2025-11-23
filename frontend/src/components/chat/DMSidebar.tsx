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

  // ✅ TAILLES AUGMENTÉES DANS LE SKELETON AUSSI
  const DMPlaceholder = ({ animate = false }: { animate?: boolean }) => (
    <div className={`flex items-center gap-4 px-3 py-3 mb-1 ${animate ? 'animate-pulse' : 'opacity-20'}`}>
      <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0" /> {/* w-8 -> w-10 */}
      <div className="h-4 w-32 bg-slate-700 rounded-full" /> {/* h-3 -> h-4 */}
    </div>
  );

  return (
    <div className="flex flex-col min-h-0 p-3 space-y-1 select-none"> {/* p-2 -> p-3 */}
        
      {/* Bouton Amis */}
      <div 
        onClick={() => setActiveConversation(null)} 
        className={`flex items-center gap-4 px-3 py-3 rounded-md cursor-pointer mb-6 transition-colors
          ${!activeConversation ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
        `}
      >
        <div className="w-6 h-6 flex items-center justify-center">
            {/* Icône légèrement plus grande */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <span className="font-medium text-base">Amis</span> {/* text-sm -> text-base */}
      </div>

      <div className="text-xs font-bold text-slate-400 uppercase px-3 mb-3 tracking-wide flex justify-between items-center">
          <span>Messages Privés</span>
          <span className="hover:text-white cursor-pointer text-xl leading-4 transition-colors">+</span>
      </div>

      {isLoading && (
        <div className="space-y-1">
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
            className={`group flex items-center gap-4 px-3 py-3 rounded-md cursor-pointer transition
              ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
            `}
          >
            <div className="relative">
                {/* Avatar : w-10 h-10 (40px) */}
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden transition-transform group-hover:scale-105">
                  {otherUser.avatarUrl ? (
                    <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt={otherUser.username} />
                  ) : (
                    otherUser.username[0].toUpperCase()
                  )}
                </div>
                {/* Pastille de statut un peu plus grosse */}
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-slate-800 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Pseudo plus grand (text-base) */}
                <span className={`font-medium text-base truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>
                  {otherUser.username}
                </span>
                {/* Optionnel : Tu pourrais ajouter le dernier message en petit ici plus tard */}
            </div>

            <div 
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity p-1.5 hover:bg-slate-600 rounded"
                onClick={(e) => {
                    e.stopPropagation();
                    closeConversation(conv.id);
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
        );
      })}

      {!isLoading && conversations.length === 0 && (
         <div className="flex flex-col">
            {[...Array(5)].map((_, i) => <DMPlaceholder key={`ghost-${i}`} animate={false} />)}
            
            <div className="mt-6 px-4 text-center">
                <p className="text-sm text-slate-500">Aucune conversation récente.</p>
                <p className="text-xs text-slate-600 mt-1">Ajoute des amis pour discuter !</p>
            </div>
         </div>
      )}
    </div>
  );
}