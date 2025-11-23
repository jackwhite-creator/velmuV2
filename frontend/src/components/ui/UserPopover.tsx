import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import Tooltip from './Tooltip';

interface UserPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void; // 👈 NOUVELLE PROP
  triggerRect: DOMRect | null;
}

// --- ICONES ---
const Icons = {
  Copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function UserPopover({ isOpen, onClose, onOpenSettings, onOpenProfile, triggerRect }: UserPopoverProps) {
  const { user, logout } = useAuthStore();
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!isOpen || !triggerRect || !user) return null;

  const handleCopy = () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    navigator.clipboard.writeText(`${user.username}#${user.discriminator}`);
    setIsCopied(true);
    copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleSettings = () => {
    onClose();
    onOpenSettings();
  };
  
  // 👇 NOUVELLE FONCTION
  const handleProfile = () => {
    onClose();
    onOpenProfile();
  };

  const style: React.CSSProperties = {
    bottom: window.innerHeight - triggerRect.top + 10,
    left: triggerRect.left,
  };

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      
      <motion.div
        style={style}
        className="fixed z-50 w-[300px] bg-slate-900 rounded-lg shadow-2xl border border-slate-700/50 overflow-hidden"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.1 } }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="h-20 bg-indigo-500">
            {user.bannerUrl && <img src={user.bannerUrl} className="w-full h-full object-cover" />}
        </div>

        <div className="p-4 relative">
            <div 
              // 👇 ON CONNECTE LA NOUVELLE FONCTION
              onClick={handleProfile} 
              className="absolute -top-12 left-4 w-20 h-20 rounded-full bg-slate-900 p-1.5 cursor-pointer group"
            >
                <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.username[0].toUpperCase()}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white uppercase tracking-wider">
                    Profil
                </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
                <div>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-lg font-bold text-white">{user.username}</h3>
                        <p className="text-xs text-slate-400">#{user.discriminator}</p>
                    </div>
                </div>
                
                <Tooltip text={isCopied ? "Copié !" : "Copier le pseudo"} side="top">
                    <button onClick={handleCopy} className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition">
                        {isCopied ? Icons.Check : Icons.Copy}
                    </button>
                </Tooltip>
            </div>
        </div>

        <hr className="border-slate-800" />
        
        <div className="p-2">
            <button onClick={handleSettings} className="w-full text-left flex items-center gap-3 px-2 py-2 rounded text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
                {Icons.Settings} <span>Paramètres</span>
            </button>
            <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-2 py-2 rounded text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition">
                {Icons.Logout} <span>Déconnexion</span>
            </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}