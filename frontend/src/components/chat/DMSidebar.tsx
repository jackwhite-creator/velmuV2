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
    setConversations, setActiveConversation 
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

  // Petit composant interne pour les placeholders
  const DMPlaceholder = ({ animate = false }: { animate?: boolean }) => (
    <div className={`flex items-center gap-3 px-2 py-2 mb-1 ${animate ? 'animate-pulse' : 'opacity-20'}`}>
      {/* Cercle Avatar */}
      <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
      {/* Barre Pseudo */}
      <div className="h-3 w-24 bg-slate-700 rounded-full" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-0 p-2 space-y-0.5 select-none">
        
      {/* Bouton Amis */}
      <div 
        onClick={() => setActiveConversation(null)} 
        className={`flex items-center gap-3 px-2 py-2.5 rounded cursor-pointer mb-4 transition-colors
          ${!activeConversation ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
        `}
      >
        <div className="w-6 h-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <span className="font-medium text-sm">Amis</span>
      </div>

      <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-wide flex justify-between items-center">
          <span>Messages Privés</span>
          <span className="hover:text-white cursor-pointer text-lg leading-3 transition-colors">+</span>
      </div>

      {/* 1. CHARGEMENT : On affiche des skeletons animés */}
      {isLoading && (
        <div className="space-y-1">
           {[...Array(3)].map((_, i) => <DMPlaceholder key={i} animate={true} />)}
        </div>
      )}

      {/* 2. LISTE RÉELLE */}
      {!isLoading && conversations.map(conv => {
        const otherUser = getOtherUser(conv);
        const isActive = activeConversation?.id === conv.id;
        const isOnline = onlineUsers.has(otherUser.id);

        return (
          <div 
            key={conv.id}
            onClick={() => setActiveConversation(conv)}
            onContextMenu={(e) => onUserContextMenu(e, otherUser)}
            className={`group flex items-center gap-3 px-2 py-2 rounded cursor-pointer transition
              ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
            `}
          >
            <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden transition-transform group-hover:scale-105">
                  {otherUser.avatarUrl ? (
                    <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt={otherUser.username} />
                  ) : (
                    otherUser.username[0].toUpperCase()
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-[2.5px] border-slate-800 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>
                  {otherUser.username}
                </span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
        );
      })}

      {/* 3. VIDE : Si pas de conv et pas de chargement, on affiche les fantômes statiques */}
      {!isLoading && conversations.length === 0 && (
         <div className="flex flex-col">
            {/* On génère 5 placeholders fantômes */}
            {[...Array(5)].map((_, i) => <DMPlaceholder key={`ghost-${i}`} animate={false} />)}
            
            {/* Petit message discret */}
            <div className="mt-4 px-2 text-center">
                <p className="text-xs text-slate-600">Aucune conversation récente.</p>
                <p className="text-[10px] text-slate-700 mt-1">Ajoute des amis pour discuter !</p>
            </div>
         </div>
      )}
    </div>
  );
}