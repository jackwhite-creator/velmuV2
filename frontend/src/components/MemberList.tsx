import React from 'react';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import Tooltip from './ui/Tooltip';

interface Props {
  onUserClick: (e: React.MouseEvent, userId: string) => void;
}

export default function MemberList({ onUserClick }: Props) {
  const { activeServer, onlineUsers } = useServerStore();
  
  if (!activeServer || !activeServer.members) return null;

  const sortedMembers = [...activeServer.members].sort((a, b) => 
    a.user.username.localeCompare(b.user.username)
  );

  const onlineMembers = sortedMembers.filter(m => onlineUsers.has(m.userId));
  const offlineMembers = sortedMembers.filter(m => !onlineUsers.has(m.userId));

  const getMemberColor = (member: any) => {
    if (!member.roles || member.roles.length === 0) return '#9ca3af';
    return member.roles[0].color;
  };

  const MemberItem = ({ member }: { member: any }) => {
    const isOnline = onlineUsers.has(member.userId);
    const color = getMemberColor(member);
    const isOwner = member.userId === activeServer.ownerId;
    
    return (
      <div 
        onClick={(e) => onUserClick(e, member.userId)}
        // 👇 AJOUT : select-none empêche le curseur texte partout dans la carte
        className="flex items-center gap-3 p-2 mx-2 rounded-md border border-transparent hover:bg-slate-700 hover:border-slate-600 cursor-pointer group transition-all duration-150 select-none"
      >
        {/* AVATAR */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden text-white font-bold text-xs">
            {member.user.avatarUrl ? (
              <img src={member.user.avatarUrl} alt={member.user.username} className="w-full h-full object-cover" />
            ) : (
              member.user.username[0].toUpperCase()
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>

        {/* INFOS */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
                <span 
                    className="font-medium text-sm truncate opacity-90 group-hover:opacity-100"
                    style={{ color: color }}
                >
                    {member.user.username}
                </span>
                
                {/* 👑 ICONE COURONNE */}
                {isOwner && (
                <Tooltip text="Propriétaire du serveur" side="top">
                    {/* On garde cursor-default et on ajoute une div tampon pour faciliter le survol */}
                    <div className="text-amber-400 flex-shrink-0 cursor-default flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
                        </svg>
                    </div>
                </Tooltip>
            )}
            </div>
          </div>
          
          <div className="text-xs text-slate-500 truncate group-hover:text-slate-400">
             {member.user.bio || `#${member.user.discriminator}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full py-4 overflow-y-auto custom-scrollbar">
      
      {/* EN LIGNE */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-4 tracking-wide select-none">
          En ligne — {onlineMembers.length}
        </h3>
        <div className="space-y-0.5">
          {onlineMembers.map((member) => (
            <MemberItem key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* HORS LIGNE */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-4 tracking-wide select-none">
          Hors ligne — {offlineMembers.length}
        </h3>
        <div className="space-y-0.5 opacity-80">
           {offlineMembers.length > 0 ? (
               offlineMembers.map((member) => (
                <MemberItem key={member.id} member={member} />
               ))
           ) : (
               <div className="px-4 text-xs text-slate-600 italic select-none">C'est bien calme par ici...</div>
           )}
        </div>
      </div>

    </div>
  );
}