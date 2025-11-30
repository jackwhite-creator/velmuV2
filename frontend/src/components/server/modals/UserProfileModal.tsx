import React, { useEffect, useState } from 'react';
import BetterUserProfileModal from '../../user/profile/UserProfileModal';

export default function UserProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenProfile = (e: CustomEvent<{ userId: string }>) => {
      setUserId(e.detail.userId);
      setIsOpen(true);
    };

    window.addEventListener('open-profile', handleOpenProfile as EventListener);
    return () => window.removeEventListener('open-profile', handleOpenProfile as EventListener);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setUserId(null);
  };

  if (!isOpen || !userId) return null;

  return (
    <BetterUserProfileModal 
        userId={userId} 
        onClose={handleClose} 
        onOpenSettings={() => {}} // No settings action from context menu for now
    />
  );
}
