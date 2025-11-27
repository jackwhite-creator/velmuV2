import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useServerStore, Server, Conversation } from '../../store/serverStore';
import { useFriendStore } from '../../store/friendStore';
import api from '../../lib/api';

import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import ConfirmModal from '../ui/ConfirmModal';
import CreateServerModal from '../server/modals/CreateServerModal';
import JoinServerModal from '../server/modals/JoinServerModal';
import InviteModal from '../server/modals/InviteModal';

const styles = `
  @keyframes tooltipPop {
    0% { opacity: 0; transform: translateY(-50%) scale(0.9); }
    100% { opacity: 1; transform: translateY(-50%) scale(1); }
  }
  .animate-tooltip-rail {
    animation: tooltipPop 0.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
`;

const Icons = {
  Invite: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Leave: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

const RailTooltip = ({ text, rect }: { text: string, rect: DOMRect }) => {
  if (!rect) return null;
  const style: React.CSSProperties = {
    top: rect.top + rect.height / 2, 
    left: rect.right + 12, 
  };

  return createPortal(
    <>
      <style>{styles}</style>
      <div className="fixed z-[9999] flex items-center animate-tooltip-rail origin-left" style={style}>
        <div className="absolute -left-1.5 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-black" style={{ top: '50%', marginTop: '-6px' }} />
        <div className="bg-black text-white text-[14px] font-bold px-3 py-2 rounded-md shadow-xl whitespace-nowrap leading-none">
          {text}
        </div>
      </div>
    </>,
    document.body
  );
};

const RailItem = ({ 
  onClick, isActive, colorClass, icon, label, isImage = false, onContextMenu, variant = 'default', badgeCount
}: { 
  onClick: () => void, isActive?: boolean, colorClass?: string, icon: React.ReactNode, label: string, isImage?: boolean, onContextMenu?: (e: React.MouseEvent) => void, variant?: 'default' | 'action', badgeCount?: number
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative group flex items-center justify-center w-full mb-2">
      <div 
        className={`absolute left-0 bg-white rounded-r-md transition-all duration-200 ease-out
          ${isActive 
            ? 'h-10 top-1 w-[4px]' 
            : isHovered 
              ? 'h-5 top-3.5 w-[4px]' 
              : 'h-2 top-5 w-[4px] -translate-x-2 opacity-0'}
        `} 
      />

      <div className="relative w-[48px] h-[48px]">
        <div 
          ref={ref}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            w-full h-full cursor-pointer transition-all duration-200 ease-out overflow-hidden flex items-center justify-center
            ${isActive || isHovered ? 'rounded-[16px]' : 'rounded-[24px]'} 
            ${isActive ? (colorClass || 'bg-brand') : isHovered ? (colorClass || 'bg-brand') : 'bg-background-secondary'} 
            ${isImage ? 'bg-transparent' : ''}
            ${variant === 'action' ? 'text-status-green hover:text-white bg-background-secondary hover:bg-status-green' : ''}`}
            >
          {icon}
        </div>

        {badgeCount !== undefined && badgeCount > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-status-danger text-white text-[11px] font-bold px-1.5 h-[22px] min-w-[22px] flex items-center justify-center rounded-full border-[3px] border-background-quaternary shadow-sm z-10 pointer-events-none animate-in zoom-in duration-200">
                {badgeCount > 9 ? '9+' : badgeCount}
            </div>
        )}
      </div>

      {isHovered && ref.current && <RailTooltip text={label} rect={ref.current.getBoundingClientRect()} />}
    </div>
  );
};

interface ServerRailProps {
  onOpenCreateServer?: () => void;
  onOpenJoinServer?: () => void;
}

export default function ServerRail({ onOpenCreateServer, onOpenJoinServer }: ServerRailProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { servers, activeServer, setActiveServer, removeServer, conversations, setActiveConversation } = useServerStore();
  const { requests } = useFriendStore();
  
  const [localCreateOpen, setLocalCreateOpen] = useState(false);
  const [localJoinOpen, setLocalJoinOpen] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; server: Server } | null>(null);
  const [serverToLeave, setServerToLeave] = useState<Server | null>(null);
  const [serverToInvite, setServerToInvite] = useState<Server | null>(null);

  const unreadDMs = conversations.filter(c => c.unreadCount > 0);
  
  const pendingFriendsCount = requests.filter(r => r.status === 'PENDING' && r.receiverId === user?.id).length;

  const handleServerClick = (server: any) => {
    setActiveServer(server);
    const lastChannelId = localStorage.getItem(`velmu_last_channel_${server.id}`);
    if (lastChannelId) {
        navigate(`/channels/${server.id}/${lastChannelId}`);
    } else {
        navigate(`/channels/${server.id}`);
    }
  };

  const handleDmClick = () => { setActiveServer(null); navigate('/channels/@me'); };
  
  const handleUnreadBubbleClick = (conv: Conversation) => {
      setActiveServer(null);
      setActiveConversation(conv);
      navigate(`/channels/@me/${conv.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent, server: Server) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, server }); };

  const handleLeaveServer = async () => {
    if (!serverToLeave) return;
    try {
      await api.post(`/servers/${serverToLeave.id}/leave`);
      removeServer(serverToLeave.id);
      if (activeServer?.id === serverToLeave.id) { setActiveServer(null); navigate('/channels/@me'); }
    } catch (err) { console.error("Erreur leave server:", err); alert("Impossible de quitter le serveur"); } 
    finally { setServerToLeave(null); }
  };

  const openCreate = onOpenCreateServer || (() => setLocalCreateOpen(true));
  const openJoin = onOpenJoinServer || (() => setLocalJoinOpen(true));

  const getOtherUser = (conversation: Conversation) => {
    return conversation.users.find(u => u.id !== user?.id) || conversation.users[0];
  };

  return (
    <div className="w-[72px] bg-background-quaternary flex flex-col items-center py-3 overflow-y-auto custom-scrollbar flex-shrink-0 z-30 scrollbar-none border-r border-[#1e1f22]/50">
      
      <RailItem 
        label="Messages Privés"
        isActive={!activeServer}
        onClick={handleDmClick}
        colorClass="bg-brand"
        badgeCount={pendingFriendsCount}
        icon={
           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
             <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
           </svg>
        }
      />

      <div className="w-8 h-[2px] bg-background-secondary rounded-sm mx-auto mb-2" />

      {unreadDMs.map(conv => {
          const otherUser = getOtherUser(conv);
          return (
            <RailItem
                key={conv.id}
                label={`${otherUser.username}`}
                onClick={() => handleUnreadBubbleClick(conv)}
                isImage={!!otherUser.avatarUrl}
                badgeCount={conv.unreadCount}
                icon={
                    otherUser.avatarUrl ? (
                      <img src={otherUser.avatarUrl} className="w-full h-full object-cover" alt={otherUser.username} />
                    ) : (
                      <div className="w-full h-full bg-background-secondary flex items-center justify-center text-text-normal font-bold text-xs">
                        {otherUser.username[0].toUpperCase()}
                      </div>
                    )
                }
            />
          );
      })}

      {unreadDMs.length > 0 && <div className="w-8 h-[2px] bg-background-secondary rounded-sm mx-auto mb-2 opacity-50" />}

      {servers.map((server) => (
        <RailItem
          key={server.id}
          label={server.name}
          isActive={activeServer?.id === server.id}
          onClick={() => handleServerClick(server)}
          onContextMenu={(e) => handleContextMenu(e, server)}
          isImage={!!server.iconUrl}
          icon={
            server.iconUrl ? (
              <img src={server.iconUrl} className="w-full h-full object-cover" alt={server.name} />
            ) : (
              <span className="text-text-normal font-medium text-xs group-hover:text-text-header transition-colors">
                {server.name.substring(0, 2).toUpperCase()}
              </span>
            )
          }
        />
      ))}

      <RailItem 
        label="Créer un serveur"
        variant="action"
        onClick={openCreate}
        icon={<svg className="w-6 h-6 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
      />

      <RailItem 
        label="Rejoindre un serveur"
        variant="action"
        onClick={openJoin}
        icon={<svg className="w-6 h-6 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>}
      />

      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
            <ContextMenuItem label="Inviter des gens" icon={Icons.Invite} onClick={() => { setServerToInvite(contextMenu.server); setContextMenu(null); }} />
            <ContextMenuSeparator />
            {user?.id !== contextMenu.server.ownerId && <ContextMenuItem label="Quitter le serveur" variant="danger" icon={Icons.Leave} onClick={() => { setServerToLeave(contextMenu.server); setContextMenu(null); }} />}
            {user?.id === contextMenu.server.ownerId && <ContextMenuItem label="Supprimer le serveur" variant="danger" icon={Icons.Leave} onClick={() => { alert("À venir !"); setContextMenu(null); }} />}
        </ContextMenu>
      )}

      <CreateServerModal isOpen={localCreateOpen} onClose={() => setLocalCreateOpen(false)} />
      <JoinServerModal isOpen={localJoinOpen} onClose={() => setLocalJoinOpen(false)} />
      <InviteModal isOpen={!!serverToInvite} onClose={() => setServerToInvite(null)} server={serverToInvite} />
      <ConfirmModal 
        isOpen={!!serverToLeave} onClose={() => setServerToLeave(null)} onConfirm={handleLeaveServer}
        title={`Quitter ${serverToLeave?.name}`} message={<span>Êtes-vous sûr de vouloir quitter <strong>{serverToLeave?.name}</strong> ?</span>}
        isDestructive={true} confirmText="Quitter"
      />
    </div>
  );
}