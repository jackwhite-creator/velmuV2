import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import UserPopover from '../user/UserPopover';
import Tooltip from '../ui/Tooltip';
import ProfileModal from '../user/modals/ProfileModal';
import UserProfileModal from '../user/profile/UserProfileModal';

export default function UserFooter() {
  const { user } = useAuthStore();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  if (!user) return null;

  const handleOpenPopover = () => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    setIsPopoverOpen(true);
  };

  const openSettingsFromProfile = () => {
    setIsProfileOpen(false);
    setIsSettingsOpen(true);
  };

  return (
    <>
      <div ref={triggerRef} className="bg-background-tertiary p-1.5 flex items-center gap-1 border-t border-background-tertiary">
        
        {/* Zone Utilisateur */}
        <div 
          onClick={handleOpenPopover}
          className="flex items-center gap-2.5 flex-1 p-1 pl-1.5 rounded-sm cursor-pointer select-none group hover:bg-background-modifier-hover transition-colors" 
        >
          <div className="relative">
            {/* Avatar Rond */}
            <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center font-bold text-xs text-text-header overflow-hidden shadow-sm">
              {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <img src="/default_avatar.png" className="w-full h-full object-cover" />}
            </div>
            {/* Pastille Statut */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-green border-[2.5px] border-background-tertiary rounded-full"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate text-text-header leading-tight">{user.username}</div>
            <div className="text-[11px] text-text-muted leading-tight font-medium group-hover:text-text-normal">#{user.discriminator}</div>
          </div>
        </div>
        
        {/* Boutons d'action (Settings) */}
        <Tooltip text="Paramètres" side="top">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-background-modifier-hover rounded-sm text-text-muted hover:text-text-normal transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </Tooltip>
      </div>

      <UserPopover 
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        triggerRect={triggerRect}
      />

      <ProfileModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <UserProfileModal 
        userId={isProfileOpen ? user.id : null}
        onClose={() => setIsProfileOpen(false)}
        onOpenSettings={openSettingsFromProfile}
      />
    </>
  );
}