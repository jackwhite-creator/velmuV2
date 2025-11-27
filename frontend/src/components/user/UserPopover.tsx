import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  triggerRect: DOMRect | null;
}

export default function UserPopover({ isOpen, onClose, onOpenSettings, onOpenProfile, triggerRect }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: PointerEvent | MouseEvent) => {
      if (popoverRef.current && popoverRef.current.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    document.addEventListener('pointerdown', handleClickOutside);
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user || !triggerRect) return null;

  const handleCopyUsername = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${user.username}#${user.discriminator}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLogout = () => {
      logout();
      onClose();
      navigate('/login');
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: triggerRect.left + 12,
    bottom: window.innerHeight - triggerRect.top + 12,
    width: '300px',
    zIndex: 9999,
  };

  return createPortal(
    <div 
      ref={popoverRef} 
      style={style} 
      className="bg-[#2b2d31] border border-[#1e1f22] rounded-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans select-none"
    >
      {/* BANNIÈRE */}
      <div className="h-20 w-full bg-[#1e1f22]"></div>

      <div className="px-4 relative pb-3">
        
        {/* AVATAR */}
        <div className="absolute -top-12 left-4">
            <div 
                onClick={() => { onClose(); onOpenProfile(); }}
                className="relative group cursor-pointer"
            >
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-2xl overflow-hidden ring-[6px] ring-[#2b2d31] transition-opacity group-hover:opacity-90">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                        user.username[0].toUpperCase()
                    )}
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-[5px] border-[#2b2d31] rounded-full"></div>
                
                <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-wider pointer-events-none">
                    Voir
                </div>
            </div>
        </div>

        {/* INFO USER */}
        <div className="mt-10 mb-4 pl-1">
            <div 
                onClick={handleCopyUsername}
                className="group flex items-center gap-2 cursor-pointer p-1.5 -ml-1.5 rounded hover:bg-black/20 transition-colors"
            >
                <div className="flex flex-col">
                    <span className="font-bold text-xl text-white leading-tight">{user.username}</span>
                    <span className="text-xs text-zinc-400 font-medium">#{user.discriminator}</span>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto mr-2">
                    {copySuccess ? (
                        <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">Copié !</span>
                    ) : (
                        <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                </div>
            </div>
        </div>

        {/* MENU ACTIONS */}
        <div className="space-y-1 border-t border-[#1e1f22] pt-2 mt-2">
            <button 
                onClick={() => { onOpenSettings(); onClose(); }}
                className="w-full text-left px-3 py-2 rounded-sm hover:bg-indigo-500 text-zinc-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-3 group"
            >
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Paramètres
            </button>
            
            <div className="h-px bg-[#1e1f22] my-1 mx-2"></div>

            <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-sm hover:bg-red-600 text-red-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-3 group"
            >
                <svg className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Déconnexion
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
}