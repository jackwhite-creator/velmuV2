import { useAuthStore } from '../../store/authStore';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useServerStore, Server } from '../../store/serverStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import ConfirmModal from '../ui/ConfirmModal';
import CreateServerModal from '../CreateServerModal';
import JoinServerModal from '../JoinServerModal';
import InviteModal from '../../components/InviteModal';

// --- STYLE TOOLTIP (Simple & Carré) ---
const styles = `
  @keyframes tooltipPop {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  .animate-tooltip {
    animation: tooltipPop 0.1s ease-out forwards;
  }
`;

const Icons = {
  Invite: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Leave: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

// --- TOOLTIP COMPACT ---
const RailTooltip = ({ text, rect }: { text: string, rect: DOMRect }) => {
  if (!rect) return null;
  const style: React.CSSProperties = {
    top: rect.top + rect.height / 2, 
    left: rect.right + 12, 
  };

  return createPortal(
    <>
      <style>{styles}</style>
      <div className="fixed z-[9999] flex items-center animate-tooltip origin-left" style={style}>
        <div className="absolute -left-1.5 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-black" style={{ top: '50%', transform: 'translateY(-50%)' }} />
        {/* Tooltip noir, carré, police petite */}
        <div className="bg-black text-zinc-100 text-xs font-bold px-3 py-1.5 rounded-sm shadow-xl whitespace-nowrap">
          {text}
        </div>
      </div>
    </>,
    document.body
  );
};

// --- ITEMS (Style Bloc) ---
const RailItem = ({ 
  onClick, isActive, colorClass, icon, label, isImage = false, onContextMenu, variant = 'default'
}: { 
  onClick: () => void, isActive?: boolean, colorClass?: string, icon: React.ReactNode, label: string, isImage?: boolean, onContextMenu?: (e: React.MouseEvent) => void, variant?: 'default' | 'action'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative group flex items-center justify-center w-full mb-2">
      {/* INDICATEUR (Barre latérale) */}
      <div 
        className={`absolute left-0 bg-white rounded-r-sm transition-all duration-200 ease-out
          ${isActive 
            ? 'h-10 top-1 w-[4px]' 
            : isHovered 
              ? 'h-5 top-3.5 w-[4px]' 
              : 'h-2 top-5 w-[4px] -translate-x-2 opacity-0'}
        `} 
      />

      <div 
        ref={ref}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          w-[48px] h-[48px] cursor-pointer transition-all duration-200 ease-out overflow-hidden flex items-center justify-center
          ${isActive || isHovered ? 'rounded-md' : 'rounded-[24px]'} 
          ${isActive ? (colorClass || 'bg-indigo-600') : isHovered ? (colorClass || 'bg-indigo-600') : 'bg-[#313338]'}
          ${isImage ? 'bg-transparent' : ''}
          ${variant === 'action' ? 'text-emerald-500 hover:text-white bg-[#313338] hover:bg-emerald-600' : ''}
        `}
      >
        {icon}
      </div>

      {isHovered && ref.current && <RailTooltip text={label} rect={ref.current.getBoundingClientRect()} />}
    </div>
  );
};

export default function ServerRail() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { servers, activeServer, setActiveServer, setActiveChannel, removeServer } = useServerStore();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; server: Server } | null>(null);
  const [serverToLeave, setServerToLeave] = useState<Server | null>(null);
  const [serverToInvite, setServerToInvite] = useState<Server | null>(null);

  const handleServerClick = (server: any) => {
    setActiveServer(server);
    navigate(`/channels/${server.id}`);
    const savedChannelId = localStorage.getItem('lastChannelId');
    let targetChannel = null;
    if (savedChannelId && server.categories) {
        const allChannels = server.categories.flatMap((c: any) => c.channels) || [];
        targetChannel = allChannels.find((c: any) => c.id === savedChannelId);
    }
    if (!targetChannel && server.categories?.[0]?.channels?.[0]) {
      targetChannel = server.categories[0].channels[0];
    }
    setActiveChannel(targetChannel);
  };

  const handleDmClick = () => { setActiveServer(null); navigate('/channels/@me'); };
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

  return (
    // ✅ FOND NOIR PROFOND (#111214) + Largeur standard 72px
    <div className="w-[72px] bg-[#111214] flex flex-col items-center py-3 overflow-y-auto custom-scrollbar flex-shrink-0 z-30 scrollbar-none">
      
      {/* ACCUEIL */}
      <RailItem 
        label="Messages Privés"
        isActive={!activeServer}
        onClick={handleDmClick}
        colorClass="bg-[#5865F2]"
        icon={<img src="/logo.png" alt="Velmu" className="w-7 h-7 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />}
      />

      <div className="w-8 h-[2px] bg-[#35363C] rounded-sm mx-auto mb-2" />

      {/* LISTE */}
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
              <span className="text-zinc-300 font-medium text-xs group-hover:text-white">
                {server.name.substring(0, 2).toUpperCase()}
              </span>
            )
          }
        />
      ))}

      {/* ACTIONS */}
      <RailItem 
        label="Créer un serveur"
        variant="action"
        onClick={() => setIsCreateOpen(true)}
        icon={<svg className="w-6 h-6 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
      />

      <RailItem 
        label="Rejoindre un serveur"
        variant="action"
        onClick={() => setIsJoinOpen(true)}
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

      <CreateServerModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinServerModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <InviteModal isOpen={!!serverToInvite} onClose={() => setServerToInvite(null)} server={serverToInvite} />
      <ConfirmModal 
        isOpen={!!serverToLeave} onClose={() => setServerToLeave(null)} onConfirm={handleLeaveServer}
        title={`Quitter ${serverToLeave?.name}`} message={<span>Êtes-vous sûr de vouloir quitter <strong>{serverToLeave?.name}</strong> ?</span>}
        isDestructive={true} confirmText="Quitter"
      />
    </div>
  );
}