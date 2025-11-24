import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  triggerRect: DOMRect | null;
}

export default function UserPopover({ isOpen, onClose, onOpenSettings, onOpenProfile, triggerRect }: Props) {
  const { user, logout } = useAuthStore();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleCopyUsername = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${user.username}#${user.discriminator}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: triggerRect.left + 12,
    bottom: window.innerHeight - triggerRect.top + 12,
    width: '300px',
    zIndex: 50,
  };

  return createPortal(
    <div 
      ref={popoverRef} 
      style={style} 
      className="bg-[#111214] border border-zinc-900 rounded-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
    >
      <div className="h-20 w-full bg-zinc-800"></div>

      <div className="px-4 relative pb-3">
        
        {/* AVATAR CLIQUABLE */}
        <div className="absolute -top-12 left-4">
            <div 
                // ✅ CORRECTION : On ferme le popover AVANT d'ouvrir le profil
                onClick={() => { onClose(); onOpenProfile(); }}
                className="relative group cursor-pointer"
            >
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-2xl overflow-hidden ring-6 ring-[#111214] transition-opacity group-hover:opacity-90">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                        user.username[0].toUpperCase()
                    )}
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-[5px] border-[#111214] rounded-full"></div>
                
                <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-wider pointer-events-none">
                    Voir
                </div>
            </div>
        </div>

        <div className="mt-10 mb-4 pl-1">
            <div 
                onClick={handleCopyUsername}
                className="group flex items-center gap-2 cursor-pointer p-1 -ml-1 rounded hover:bg-zinc-800/50 transition-colors"
            >
                <div className="flex flex-col">
                    <span className="font-bold text-xl text-white leading-tight">{user.username}</span>
                    <span className="text-xs text-zinc-400 font-medium">#{user.discriminator}</span>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto mr-2">
                    {copySuccess ? (
                        <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">Copié !</span>
                    ) : (
                        <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-1 border-t border-zinc-800 pt-3 mt-2">
            <button 
                onClick={() => { onOpenSettings(); onClose(); }}
                className="w-full text-left px-3 py-2.5 rounded-sm hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-3 group"
            >
                <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Paramètres
            </button>
            
            <div className="h-px bg-zinc-800/50 my-1 mx-3"></div>

            <button 
                onClick={() => { logout(); onClose(); }}
                className="w-full text-left px-3 py-2.5 rounded-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex items-center gap-3 group"
            >
                <svg className="w-4 h-4 text-red-500/70 group-hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Déconnexion
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
}