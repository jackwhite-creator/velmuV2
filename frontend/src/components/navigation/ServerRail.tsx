import { useAuthStore } from '../../store/authStore';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useServerStore, Server } from '../../store/serverStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

// UI
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import ConfirmModal from '../ui/ConfirmModal';

// Modales
import CreateServerModal from '../CreateServerModal';
import JoinServerModal from '../JoinServerModal';
import InviteModal from '../../components/InviteModal';

// --- STYLE & ANIMATION ---
const styles = `
  @keyframes tooltipPop {
    0% { opacity: 0; transform: translateY(-50%) scale(0.9) translateX(-5px); }
    100% { opacity: 1; transform: translateY(-50%) scale(1) translateX(0); }
  }
  .animate-tooltip {
    animation: tooltipPop 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
`;

// --- ICONES DU MENU ---
const Icons = {
  Invite: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Leave: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

// --- 1. COMPOSANT TOOLTIP ---
const RailTooltip = ({ text, rect }: { text: string, rect: DOMRect }) => {
  if (!rect) return null;

  const style: React.CSSProperties = {
    top: rect.top + rect.height / 2, 
    left: rect.right + 14,           
  };

  return createPortal(
    <>
      <style>{styles}</style>
      <div 
        className="fixed z-[9999] flex items-center animate-tooltip origin-left"
        style={style}
      >
        <div 
          className="absolute -left-1.5 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#111214]"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        <div className="bg-[#111214] text-white text-[14px] font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
          {text}
        </div>
      </div>
    </>,
    document.body
  );
};

// --- 2. BOUTON GÉNÉRIQUE ---
const RailItem = ({ 
  onClick, isActive, colorClass, icon, label, isImage = false, onContextMenu 
}: { 
  onClick: () => void, 
  isActive?: boolean, 
  colorClass?: string, 
  icon: React.ReactNode, 
  label: string, 
  isImage?: boolean,
  onContextMenu?: (e: React.MouseEvent) => void 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative group flex items-center justify-center w-full mb-2">
      <div 
        className={`absolute left-0 bg-white rounded-r-full transition-all duration-300 ease-out
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
          w-[48px] h-[48px] cursor-pointer transition-all duration-300 ease-out overflow-hidden flex items-center justify-center
          ${isActive || isHovered ? 'rounded-[16px]' : 'rounded-[24px]'}
          ${isActive ? (colorClass || 'bg-[#5865F2]') : isHovered ? (colorClass || 'bg-[#5865F2]') : 'bg-[#313338]'}
          ${isImage ? 'bg-transparent' : ''}
        `}
      >
        {icon}
      </div>

      {isHovered && ref.current && (
        <RailTooltip text={label} rect={ref.current.getBoundingClientRect()} />
      )}
    </div>
  );
};

// --- 3. COMPOSANT PRINCIPAL ---
export default function ServerRail() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // ✅ CORRECTIF : On ne récupère plus 'setServers' car on ne fait plus de fetch ici
  const { servers, activeServer, setActiveServer, setActiveChannel, removeServer } = useServerStore();
  
  // Modales de base
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // États pour le clic droit
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; server: Server } | null>(null);
  
  // États pour les actions contextuelles
  const [serverToLeave, setServerToLeave] = useState<Server | null>(null);
  const [serverToInvite, setServerToInvite] = useState<Server | null>(null);

  // ❌ L'ANCIEN USE EFFECT A ÉTÉ SUPPRIMÉ ICI POUR ÉVITER L'ERREUR 403 ❌

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

  const handleDmClick = () => {
    setActiveServer(null); 
    navigate('/channels/@me');
  };

  // --- GESTION CLIC DROIT ---
  const handleContextMenu = (e: React.MouseEvent, server: Server) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, server });
  };

  // --- ACTION: QUITTER LE SERVEUR ---
  const handleLeaveServer = async () => {
    if (!serverToLeave) return;
    try {
      await api.post(`/servers/${serverToLeave.id}/leave`);
      removeServer(serverToLeave.id);
      
      // Si on était sur ce serveur, on retourne à l'accueil
      if (activeServer?.id === serverToLeave.id) {
        setActiveServer(null);
        navigate('/channels/@me');
      }
    } catch (err) {
      console.error("Erreur leave server:", err);
      alert("Impossible de quitter le serveur (êtes-vous le propriétaire ?)");
    } finally {
      setServerToLeave(null);
    }
  };

  return (
    <div className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 overflow-y-auto custom-scrollbar flex-shrink-0 z-30 scrollbar-none">
      
      {/* 1. ACCUEIL */}
      <RailItem 
        label="Messages Privés"
        isActive={!activeServer}
        onClick={handleDmClick}
        icon={
          <img src="/logo.png" alt="Home" className="w-7 h-7 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
        }
      />

      <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mx-auto mb-2" />

      {/* 2. LISTE DES SERVEURS */}
      {servers.map((server) => (
        <RailItem
          key={server.id}
          label={server.name}
          isActive={activeServer?.id === server.id}
          onClick={() => handleServerClick(server)}
          onContextMenu={(e) => handleContextMenu(e, server)} // Clic droit activé
          isImage={!!server.iconUrl}
          icon={
            server.iconUrl ? (
              <img src={server.iconUrl} className="w-full h-full object-cover" alt={server.name} />
            ) : (
              <span className="text-slate-200 font-medium text-sm group-hover:text-white">
                {server.name.substring(0, 2).toUpperCase()}
              </span>
            )
          }
        />
      ))}

      {/* 3. ACTIONS */}
      <RailItem 
        label="Créer un serveur"
        colorClass="bg-[#23A559]"
        onClick={() => setIsCreateOpen(true)}
        icon={
          <svg className="w-6 h-6 text-[#23A559] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        }
      />

      <RailItem 
        label="Rejoindre un serveur"
        colorClass="bg-[#23A559]"
        onClick={() => setIsJoinOpen(true)}
        icon={
          <svg className="w-6 h-6 text-[#23A559] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        }
      />

      {/* --- CONTEXT MENU --- */}
      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
            <ContextMenuItem 
                label="Inviter des gens" 
                icon={Icons.Invite} 
                onClick={() => { 
                    setServerToInvite(contextMenu.server); 
                    setContextMenu(null); 
                }} 
            />
            
            <ContextMenuSeparator />
            
            {/* 👇 CONDITION : Si je ne suis PAS le propriétaire, je peux quitter */}
            {user?.id !== contextMenu.server.ownerId && (
              <ContextMenuItem 
                  label="Quitter le serveur" 
                  variant="danger" 
                  icon={Icons.Leave} 
                  onClick={() => { 
                      setServerToLeave(contextMenu.server); 
                      setContextMenu(null); 
                  }} 
              />
            )}

            {/* 👇 (OPTIONNEL) Si je SUIS le propriétaire, je pourrais supprimer */}
            {user?.id === contextMenu.server.ownerId && (
               <ContextMenuItem 
                  label="Supprimer le serveur" 
                  variant="danger" 
                  icon={Icons.Leave} 
                  onClick={() => {
                      alert("Fonctionnalité suppression à venir !");
                      setContextMenu(null);
                  }} 
              />
            )}
        </ContextMenu>
      )}

      {/* --- MODALES --- */}
      <CreateServerModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinServerModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      
      <InviteModal 
        isOpen={!!serverToInvite} 
        onClose={() => setServerToInvite(null)} 
        server={serverToInvite} 
      />

      <ConfirmModal 
        isOpen={!!serverToLeave}
        onClose={() => setServerToLeave(null)}
        onConfirm={handleLeaveServer}
        title={`Quitter ${serverToLeave?.name}`}
        message={<span>Êtes-vous sûr de vouloir quitter <strong>{serverToLeave?.name}</strong> ? Vous ne pourrez plus voir les messages sauf si vous êtes réinvité.</span>}
        isDestructive={true}
        confirmText="Quitter le serveur"
      />

    </div>
  );
}