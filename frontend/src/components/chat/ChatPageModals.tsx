import { useAuthStore } from '../../store/authStore';
import { useServerStore } from '../../store/serverStore';
import { useFriendStore } from '../../store/friendStore';
import api from '../../lib/api';

import CreateServerModal from '../server/modals/CreateServerModal';
import InviteModal from '../server/modals/InviteModal';
import JoinServerModal from '../server/modals/JoinServerModal';
import ProfileModal from '../user/modals/ProfileModal';
import UserProfileModal from '../user/profile/UserProfileModal';
import MiniUserProfile from '../user/MiniUserProfile';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import ConfirmModal from '../ui/ConfirmModal';
import InviteFriendsModal from '../server/modals/InviteFriendsModal';

import type { ChatPageModals } from '../../hooks/useChatPageModals';

interface ChatPageModalsProps {
  modals: ChatPageModals;
}

export default function ChatPageModals({ modals }: ChatPageModalsProps) {
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();
  const { requests, addRequest, removeRequest } = useFriendStore();

  const {
    isCreateServerOpen,
    setIsCreateServerOpen,
    isInviteOpen,
    setIsInviteOpen,
    isJoinServerOpen,
    setIsJoinServerOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    viewingUserProfile,
    setViewingUserProfile,
    miniProfileUser,
    setMiniProfileUser,
    userMenu,
    setUserMenu,
    confirmRemoveOpen,
    setConfirmRemoveOpen,
    friendToDelete,
    setFriendToDelete,
    isInviteFriendsOpen,
    setIsInviteFriendsOpen,
    createdServerId,
    setCreatedServerId,
  } = modals;

  const handleSendRequest = async () => {
    if (!userMenu) return;
    try {
      const res = await api.post('/friends/request', {
        username: userMenu.user.username,
        discriminator: userMenu.user.discriminator
      });
      addRequest(res.data);
    } catch (err: any) {
      console.error("Erreur ajout ami", err);
    } finally {
      setUserMenu(null);
    }
  };

  const handleRemoveFriend = () => {
    if (!userMenu) return;
    setFriendToDelete(userMenu.user);
    setConfirmRemoveOpen(true);
    setUserMenu(null);
  };

  const performRemoveFriend = async () => {
    if (!friendToDelete) return;
    
    // Close modal immediately
    setConfirmRemoveOpen(false);

    const request = requests.find(
      r => (r.senderId === user?.id && r.receiverId === friendToDelete.id) || 
           (r.senderId === friendToDelete.id && r.receiverId === user?.id)
    );
    
    if (request) {
        removeRequest(request.id);
        try {
          await api.delete(`/friends/${request.id}`);
        } catch (err) {
          console.error(err);
        }
    }
    
    setFriendToDelete(null);
  };

  const handleCloseConfirm = () => {
    setConfirmRemoveOpen(false);
    setFriendToDelete(null);
  };

  const openSettingsFromProfile = () => {
    setViewingUserProfile(null);
    setIsSettingsOpen(true);
  };

  const isFriend = userMenu && requests.some(
    req => req.status === 'ACCEPTED' &&
      ((req.senderId === user?.id && req.receiverId === userMenu.user.id) ||
        (req.receiverId === user?.id && req.senderId === userMenu.user.id))
  );

  return (
    <>
      {/* Server Modals */}
      <CreateServerModal
        isOpen={isCreateServerOpen}
        onClose={() => setIsCreateServerOpen(false)}
        onServerCreated={(serverId) => {
            setCreatedServerId(serverId);
            setIsInviteFriendsOpen(true);
        }}
      />
      <JoinServerModal
        isOpen={isJoinServerOpen}
        onClose={() => setIsJoinServerOpen(false)}
      />
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        server={activeServer}
      />

      {/* User Modals */}
      <ProfileModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mini Profile Popover */}
      {miniProfileUser && (
        <MiniUserProfile
          userId={miniProfileUser.userId}
          anchorRect={miniProfileUser.anchorRect}
          source={miniProfileUser.source}
          serverId={activeServer?.id}
          onClose={() => setMiniProfileUser(null)}
          onOpenFullProfile={(userId) => {
            setMiniProfileUser(null);
            setViewingUserProfile(userId);
          }}
        />
      )}

      {/* Full User Profile Modal */}
      {viewingUserProfile && (
        <UserProfileModal
          userId={viewingUserProfile}
          onClose={() => setViewingUserProfile(null)}
          onOpenSettings={openSettingsFromProfile}
        />
      )}

      {/* User Context Menu */}
      {userMenu && (
        <ContextMenu position={userMenu} onClose={() => setUserMenu(null)}>
          <ContextMenuItem
            label="Profil"
            onClick={() => {
              setViewingUserProfile(userMenu.user.id);
              setUserMenu(null);
            }}
          />
          <ContextMenuItem
            label="Copier Pseudo"
            onClick={() => {
              navigator.clipboard.writeText(`${userMenu.user.username}#${userMenu.user.discriminator}`);
              setUserMenu(null);
            }}
          />

          {user?.id !== userMenu.user.id && (
            <>
              <ContextMenuSeparator />
              {isFriend ? (
                <ContextMenuItem
                  label="Retirer l'ami"
                  variant="danger"
                  onClick={handleRemoveFriend}
                />
              ) : (
                <ContextMenuItem
                  label="Ajouter en ami"
                  onClick={handleSendRequest}
                />
              )}
            </>
          )}
        </ContextMenu>
      )}

      {/* Confirm Remove Friend Modal */}
      <ConfirmModal
        isOpen={confirmRemoveOpen}
        onClose={handleCloseConfirm}
        onConfirm={performRemoveFriend}
        title={`Retirer ${friendToDelete?.username}`}
        message={`Es-tu sûr de vouloir retirer ${friendToDelete?.username} de ta liste d'amis ?`}
        isDestructive={true}
        confirmText="Retirer l'ami"
      />

      {/* Post-Creation Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={isInviteFriendsOpen}
        onClose={() => {
            setIsInviteFriendsOpen(false);
            setCreatedServerId(null);
        }}
        serverId={createdServerId}
      />
    </>
  );
}
