import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void; // Ajouté si tu veux ouvrir le grand profil
  triggerRect: DOMRect | null;
}

export default function UserPopover({ isOpen, onClose, onOpenSettings, triggerRect }: Props) {
  const { user, logout } = useAuthStore();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fermer si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !user || !triggerRect) return null;

  // Calcul de position (au-dessus du UserFooter)
  const style: React.CSSProperties = {
    position: 'absolute',
    left: triggerRect.left + 10, // Un peu décalé vers la droite
    bottom: window.innerHeight - triggerRect.top + 10, // Au dessus du footer
    width: '280px',
    zIndex: 50,
  };

  return createPortal(
    <div 
      ref={popoverRef} 
      style={style} 
      className="bg-[#111214] border border-zinc-800 rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {/* BANNIÈRE NEUTRE */}
      <div className="h-16 w-full bg-zinc-800"></div>

      <div className="px-4 relative pb-3">
        {/* AVATAR (Rond, bordure couleur fond) */}
        <div className="absolute -top-10 left-4 p-1 bg-[#111214] rounded-full">
            <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xl overflow-hidden ring-4 ring-[#111214]">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                    user.username[0].toUpperCase()
                )}
            </div>
            {/* Statut */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-[4px] border-[#111214] rounded-full"></div>
        </div>

        {/* INFO USER */}
        <div className="mt-8 mb-4 bg-[#18181b] p-3 rounded-sm border border-zinc-800/50">
            <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-white">{user.username}</span>
                <span className="text-xs text-zinc-500">#{user.discriminator}</span>
            </div>
        </div>

        {/* MENU */}
        <div className="space-y-1 border-t border-zinc-800 pt-2">
            <button 
                onClick={() => { onOpenSettings(); onClose(); }}
                className="w-full text-left px-2 py-2 rounded-sm hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors flex items-center gap-3"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Paramètres
            </button>
            
            <div className="h-px bg-zinc-800 my-1 mx-2"></div>

            <button 
                onClick={() => { logout(); onClose(); }}
                className="w-full text-left px-2 py-2 rounded-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex items-center gap-3"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Déconnexion
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
}