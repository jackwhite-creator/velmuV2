import React, { useState } from 'react';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import Tooltip from '../ui/Tooltip';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel } from '../ui/ContextMenu';
import UserContextMenuContent from '../chat/UserContextMenuContent';

interface Props {
  onUserClick: (e: React.MouseEvent, userId: string) => void;
}

export default function MemberList({ onUserClick }: Props) {
  const { activeServer, onlineUsers, getMemberColor } = useServerStore();
  const { user: currentUser } = useAuthStore();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, memberId: string } | null>(null);
  
  if (!activeServer || !activeServer.members) return null;

  const sortedMembers = [...activeServer.members].sort((a, b) => 
    a.user.username.localeCompare(b.user.username)
  );

  const onlineMembers = sortedMembers.filter(m => onlineUsers.has(m.userId));
  const offlineMembers = sortedMembers.filter(m => !onlineUsers.has(m.userId));

  const handleContextMenu = (e: React.MouseEvent, memberId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, memberId });
  };

  const MemberItem = ({ member }: { member: any }) => {
    const isOnline = onlineUsers.has(member.userId);
    const color = getMemberColor(member) || '#a1a1aa';
    const isOwner = member.userId === activeServer.ownerId;
    
    return (
      <div 
        onClick={(e) => onUserClick(e, member.userId)}
        onContextMenu={(e) => handleContextMenu(e, member.user.id)}
        className="flex items-center gap-3 px-2.5 py-1.5 mx-2 rounded-sm hover:bg-zinc-700/40 cursor-pointer group transition-colors select-none mb-0.5"
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden text-zinc-300 font-bold text-xs shadow-sm">
            {member.user.avatarUrl ? (
              <img src={member.user.avatarUrl} alt={member.user.username} className="w-full h-full object-cover" />
            ) : (
              member.user.username[0].toUpperCase()
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[2.5px] border-[#2b2d31] rounded-full bg-emerald-500"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
                <span 
                    className="font-medium text-sm truncate opacity-90 group-hover:opacity-100 transition-opacity"
                    style={{ color: color }}
                >
                    {member.user.username}
                </span>
                {isOwner && (
                <Tooltip text="Propriétaire" side="top">
                    <div className="text-amber-400 flex-shrink-0 cursor-default">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" /></svg>
                    </div>
                </Tooltip>
            )}
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 truncate group-hover:text-zinc-400 transition-colors font-medium">
             {member.user.bio || `#${member.user.discriminator}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="h-full w-full py-6 overflow-y-auto custom-scrollbar">
      <div className="mb-6">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase mb-2 px-4 tracking-wider select-none">
          En ligne — {onlineMembers.length}
        </h3>
        <div className="space-y-0.5">
          {onlineMembers.map((member) => (
            <MemberItem key={member.id} member={member} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase mb-2 px-4 tracking-wider select-none">
          Hors ligne — {offlineMembers.length}
        </h3>
        <div className="space-y-0.5 opacity-70 hover:opacity-100 transition-opacity">
           {offlineMembers.length > 0 ? (
               offlineMembers.map((member) => (
                <MemberItem key={member.id} member={member} />
               ))
           ) : (
               <div className="px-4 text-xs text-zinc-600 italic select-none py-2">Personne ne se cache ici...</div>
           )}
        </div>
      </div>
    </div>

    {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
            <UserContextMenuContent 
                memberId={contextMenu.memberId} 
                serverId={activeServer.id} 
                onClose={() => setContextMenu(null)} 
            />
        </ContextMenu>
    )}
    </>
  );
}
