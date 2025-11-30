import { useRef, useState } from 'react';
import { FullProfile } from './UserProfileModal';
import Tooltip from '../../ui/Tooltip';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../../ui/ContextMenu';
import { AnimatePresence } from 'framer-motion';

interface Props {
  profile: FullProfile;
  isOnline: boolean;
  friendStatus: string;
  isMe: boolean;
  actionLoading: boolean;
  onClose: () => void;
  actions: {
    startDM: () => void;
    sendRequest: () => void;
    acceptRequest: () => void;
    declineRequest: () => void;
    cancelRequest: () => void;
    removeFriend: () => void;
    openSettings: () => void;
  };
}

const Icons = {
    UserPlus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    UserMinus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    Copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

export default function ProfileHeader({ profile, isOnline, friendStatus, isMe, actionLoading, onClose, actions }: Props) {
  const [menuState, setMenuState] = useState<{ x: number; y: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleToggleMenu = () => {
    if (menuState) { setMenuState(null); return; }
    if (menuButtonRef.current) { const rect = menuButtonRef.current.getBoundingClientRect(); setMenuState({ x: rect.left, y: rect.bottom + 8 }); }
  };

  const renderActionButton = () => {
    const btnBase = "px-4 py-1.5 rounded-sm font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 min-w-[100px]";

    switch (friendStatus) {
      case 'ME': return <button onClick={actions.openSettings} className={`${btnBase} bg-secondary hover:bg-modifier-selected text-zinc-200`}> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Modifier </button>;
      case 'FRIEND': return <button onClick={actions.startDM} className={`${btnBase} bg-brand hover:bg-brand-hover text-white flex-1 md:w-auto`}> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Message </button>;
      case 'RECEIVED': return (
          <div className="flex gap-2">
            <button onClick={actions.acceptRequest} disabled={actionLoading} className={`${btnBase} bg-status-green text-white hover:opacity-90`}>{actionLoading ? '...' : 'Accepter'}</button>
            <button onClick={actions.declineRequest} className={`${btnBase} bg-secondary hover:bg-status-danger hover:text-white text-zinc-300`}>Refuser</button>
          </div>
      );
      case 'SENT': return <button disabled className={`${btnBase} bg-secondary text-zinc-500 cursor-default`}>Envoyée</button>;
      case 'NONE': default: return <button onClick={actions.sendRequest} disabled={actionLoading} className={`${btnBase} bg-status-green hover:opacity-90 text-white`}>Ajouter</button>;
    }
  };

  return (
    <>
      {/* BANNIÈRE */}
      <div className="h-32 w-full bg-tertiary relative">
         {profile.bannerUrl ? (
            <img src={profile.bannerUrl} className="w-full h-full object-cover animate-in fade-in duration-300" alt="Bannière" />
         ) : (
            <div className="w-full h-full bg-gradient-to-r from-tertiary to-secondary"></div>
         )}
         
         <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white p-1.5 rounded-full transition backdrop-blur-sm z-10">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
         </button>
      </div>

      <div className="px-6 relative">
         {/* HEADER AVEC AVATAR ET BOUTONS */}
         <div className="flex justify-between items-end -mt-14 mb-3">
            <div className="relative">
                {/* Bordure de l'avatar : bg-floating (couleur du fond modal) pour la découpe */}
                <div className="w-28 h-28 rounded-full bg-floating p-[6px]">
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-zinc-300 overflow-hidden shadow-inner">
                        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <img src="/default_avatar.png" alt="Avatar" className="w-full h-full object-cover" />}
                    </div>
                </div>
                <div className={`absolute bottom-2 right-2 w-7 h-7 border-[5px] border-floating rounded-full ${isOnline ? 'bg-status-green' : 'bg-zinc-500'}`} />
            </div>

            <div className="flex gap-2 mb-1">
                {renderActionButton()}
                {!isMe && (
                  <Tooltip text="Plus d'actions" side="top">
                    <button ref={menuButtonRef} onClick={handleToggleMenu} className="bg-secondary hover:bg-modifier-selected text-zinc-300 p-2 rounded-sm transition shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                  </Tooltip>
                )}
            </div>
         </div>
      </div>

      {/* MENU CONTEXTUEL */}
      <AnimatePresence>
        {menuState && (
          <ContextMenu position={menuState} onClose={() => setMenuState(null)}>
            {friendStatus === 'FRIEND' && <ContextMenuItem label="Retirer l'ami" variant="danger" icon={Icons.UserMinus} onClick={() => { actions.removeFriend(); setMenuState(null); }} />}
            {friendStatus === 'NONE' && <ContextMenuItem label="Ajouter en ami" icon={Icons.UserPlus} onClick={() => { actions.sendRequest(); setMenuState(null); }} />}
            {friendStatus === 'SENT' && <ContextMenuItem label="Annuler la demande" variant="danger" icon={Icons.UserMinus} onClick={() => { actions.cancelRequest(); setMenuState(null); }} />}
            <ContextMenuSeparator />
            <ContextMenuItem label="Copier le nom d'utilisateur" icon={Icons.Copy} onClick={() => { navigator.clipboard.writeText(`${profile?.username}#${profile?.discriminator}`); setMenuState(null); }} />
          </ContextMenu>
        )}
      </AnimatePresence>
    </>
  );
}