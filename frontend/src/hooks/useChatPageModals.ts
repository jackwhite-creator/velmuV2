import { useState } from 'react';

type UserContextMenuData = { 
  x: number; 
  y: number; 
  user: { id: string; username: string; discriminator: string; } 
};

/**
 * Hook to manage all modal states in ChatPage
 */
export function useChatPageModals() {
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinServerOpen, setIsJoinServerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<string | null>(null);
  const [miniProfileUser, setMiniProfileUser] = useState<{ 
    userId: string; 
    anchorRect: { top: number; left: number; width: number; height: number }; 
    source: 'chat' | 'member_list';
  } | null>(null);
  const [userMenu, setUserMenu] = useState<UserContextMenuData | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<{ id: string; username: string; } | null>(null);
  
  // Post-Creation Invite Modal
  const [isInviteFriendsOpen, setIsInviteFriendsOpen] = useState(false);
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);

  return {
    // Create Server Modal
    isCreateServerOpen,
    setIsCreateServerOpen,
    
    // Invite Modal
    isInviteOpen,
    setIsInviteOpen,
    
    // Join Server Modal
    isJoinServerOpen,
    setIsJoinServerOpen,
    
    // Settings Modal
    isSettingsOpen,
    setIsSettingsOpen,
    
    // User Profile Modal (full)
    viewingUserProfile,
    setViewingUserProfile,
    
    // Mini Profile Popover
    miniProfileUser,
    setMiniProfileUser,
    
    // User Context Menu
    userMenu,
    setUserMenu,
    
    // Confirm Remove Friend Modal
    confirmRemoveOpen,
    setConfirmRemoveOpen,
    friendToDelete,
    setFriendToDelete,

    // Invite Friends Modal (Post-Creation)
    isInviteFriendsOpen,
    setIsInviteFriendsOpen,
    createdServerId,
    setCreatedServerId,
  };
}

export type ChatPageModals = ReturnType<typeof useChatPageModals>;
