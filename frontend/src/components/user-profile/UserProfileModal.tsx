import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useServerStore } from '../../store/serverStore';
import { useFriendStore } from '../../store/friendStore';
import { useAuthStore } from '../../store/authStore';
import Modal from '../ui/Modal';
import ConfirmModal from '../ui/ConfirmModal';

import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';

export interface UserProfileProps {
  userId: string | null;
  onClose: () => void;
  onOpenSettings: () => void;
}

export interface FullProfile {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
}

export default function UserProfileModal({ userId, onClose, onOpenSettings }: UserProfileProps) {
  const navigate = useNavigate();
  const { onlineUsers, addConversation, setActiveConversation, setActiveServer, activeServer, conversations } = useServerStore();
  const { requests, addRequest, updateRequest, removeRequest } = useFriendStore(); 
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const isOnline = userId ? onlineUsers.has(userId) : false;
  const isMe = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      const cachedMember = activeServer?.members?.find((m: any) => m.user.id === userId);
      const cachedDMUser = conversations.flatMap(c => c.users).find(u => u.id === userId);
      const cachedSelf = isMe ? currentUser : null;
      const cachedUser = cachedMember?.user || cachedDMUser || cachedSelf;

      if (cachedUser) {
        setProfile({
            id: cachedUser.id,
            username: cachedUser.username,
            discriminator: cachedUser.discriminator,
            avatarUrl: cachedUser.avatarUrl,
            bannerUrl: (cachedUser as any).bannerUrl || null,
            bio: null,
            createdAt: undefined
        });
      } else {
        setProfile(null);
      }

      setLoading(true);
      api.get(`/users/${userId}`).then(res => setProfile(res.data)).catch(console.error).finally(() => setLoading(false));
    }
  }, [userId, activeServer, conversations, currentUser, isMe]);

  const getFriendStatus = () => {
    if (isMe) return 'ME';
    const request = requests.find(r => (r.senderId === currentUser?.id && r.receiverId === userId) || (r.senderId === userId && r.receiverId === currentUser?.id));
    if (!request) return 'NONE';
    if (request.status === 'ACCEPTED') return 'FRIEND';
    if (request.senderId === currentUser?.id) return 'SENT';
    return 'RECEIVED';
  };
  const friendStatus = getFriendStatus();

  const actions = {
    startDM: async () => {
        if (!profile) return;
        setActionLoading(true);
        try {
            const res = await api.post('/conversations', { targetUserId: profile.id });
            addConversation(res.data);
            setActiveServer(null);
            setActiveConversation(res.data);
            onClose();
            // ✅ CORRECTION : On navigue vers l'URL précise de la conversation
            navigate(`/channels/@me/${res.data.id}`);
        } catch (err) { console.error(err); } finally { setActionLoading(false); }
    },
    sendRequest: async () => {
        if (!profile) return;
        setActionLoading(true);
        try {
            const res = await api.post('/friends/request', { username: profile.username, discriminator: profile.discriminator });
            addRequest(res.data);
        } catch (error) { console.error(error); } finally { setActionLoading(false); }
    },
    acceptRequest: async () => {
        const request = requests.find(r => r.senderId === userId && r.receiverId === currentUser?.id);
        if (!request) return;
        setActionLoading(true);
        try {
            await api.post('/friends/respond', { requestId: request.id, action: 'ACCEPT' });
            updateRequest(request.id, 'ACCEPTED');
        } catch (error) { console.error(error); } finally { setActionLoading(false); }
    },
    declineRequest: async () => {
        const request = requests.find(r => r.senderId === userId && r.receiverId === currentUser?.id);
        if (!request) return;
        removeRequest(request.id);
        try { await api.delete(`/friends/${request.id}`); } catch(err) { console.error(err); }
    },
    cancelRequest: async () => {
        const request = requests.find(r => r.senderId === currentUser?.id && r.receiverId === userId);
        if (!request) return;
        removeRequest(request.id);
        try { await api.delete(`/friends/${request.id}`); } catch(err) { console.error(err); }
    },
    removeFriend: () => setConfirmRemoveOpen(true),
    openSettings: () => { onClose(); onOpenSettings(); }
  };

  const performRemoveFriend = async () => {
    const request = requests.find(r => friendStatus === 'FRIEND' && ((r.senderId === currentUser?.id && r.receiverId === userId) || (r.senderId === userId && r.receiverId === currentUser?.id)));
    if (!request) return;
    removeRequest(request.id);
    try { await api.delete(`/friends/${request.id}`); } catch(err) { console.error(err); }
  };

  if (loading && !profile) {
      return (
          <Modal isOpen={!!userId} onClose={onClose} size="lg">
              <div className="bg-[#18191c] h-[500px] animate-pulse flex flex-col">
                  <div className="h-32 bg-[#232428] w-full" />
                  <div className="px-6 -mt-14">
                      <div className="w-28 h-28 rounded-full bg-[#232428] border-[6px] border-[#18191c]" />
                      <div className="mt-4 h-8 w-40 bg-[#232428] rounded" />
                  </div>
              </div>
          </Modal>
      );
  }

  if (!profile) return null;

  return (
    <Modal isOpen={!!userId} onClose={onClose} size="lg">
      <div className="bg-[#18191c] flex flex-col text-zinc-100 min-h-[460px] animate-in fade-in duration-200 font-sans shadow-2xl rounded-lg overflow-hidden relative">
         <ProfileHeader 
            profile={profile} 
            isOnline={isOnline} 
            friendStatus={friendStatus}
            isMe={isMe}
            actions={actions}
            actionLoading={actionLoading}
            onClose={onClose}
         />
         <ProfileInfo 
            profile={profile} 
            isMe={isMe}
         />
      </div>

      <ConfirmModal
        isOpen={confirmRemoveOpen} onClose={() => setConfirmRemoveOpen(false)} onConfirm={performRemoveFriend}
        title={`Retirer ${profile.username}`}
        message="Es-tu sûr de vouloir retirer cet utilisateur de ta liste d'amis ?"
        isDestructive={true} confirmText="Retirer l'ami"
      />
    </Modal>
  );
}