import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerStore } from '../../../store/serverStore';
import { useFriendStore } from '../../../store/friendStore';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Modal from '../../ui/Modal';
import ConfirmModal from '../../ui/ConfirmModal';
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
  isBot?: boolean;
  mutualServers?: {
    id: string;
    name: string;
    iconUrl: string | null;
  }[];
}

export default function UserProfileModal({ userId, onClose, onOpenSettings }: UserProfileProps) {
  const navigate = useNavigate();
  const { onlineUsers, addConversation, conversations, activeServer } = useServerStore();
  const { requests, addRequest, updateRequest, removeRequest } = useFriendStore(); 
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const isOnline = userId ? onlineUsers.has(userId) : false;
  const isMe = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      const cachedMember = activeServer?.members?.find((m: any) => m.user.id === userId);
      const cachedDMUser = conversations.flatMap((c: any) => c.users).find((u: any) => u.id === userId);
      const cachedSelf = isMe ? currentUser : null;
      const cachedUser = cachedMember?.user || cachedDMUser || cachedSelf;

      if (cachedUser) {
        setProfile({
            id: cachedUser.id,
            username: cachedUser.username,
            discriminator: cachedUser.discriminator,
            avatarUrl: cachedUser.avatarUrl,
            bannerUrl: (cachedUser as any).bannerUrl || null,
            bio: (cachedUser as any).bio || null,
            createdAt: (cachedUser as any).createdAt || undefined,
            isBot: (cachedUser as any).isBot || false
        });
      } else {
        setProfile(null);
      }

      setLoading(true);
      Promise.all([
        api.get(`/users/${userId}`).then(res => {
            setProfile(prev => ({ ...prev, ...res.data }));
        }),
        api.get(`/badges/users/${userId}`).then(res => setBadges(res.data))
      ]).catch(console.error).finally(() => setLoading(false));
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
        if (!profile || !currentUser) return;
        setActionLoading(true);
        try {
            const res = await api.post('/conversations', { targetUserId: profile.id });
            let conversation = res.data;

            // Check if conversation exists in store to avoid overwriting valid data with potentially incomplete API response
            const exists = conversations.some(c => c.id === conversation.id);

            if (!exists) {
                // Fallback: Ensure users array exists (fixes issue if backend returns incomplete data)
                if (!conversation.users || !Array.isArray(conversation.users)) {
                    conversation = {
                        ...conversation,
                        users: [
                            { 
                                id: currentUser.id, 
                                username: currentUser.username, 
                                discriminator: currentUser.discriminator, 
                                avatarUrl: currentUser.avatarUrl 
                            },
                            { 
                                id: profile.id, 
                                username: profile.username, 
                                discriminator: profile.discriminator, 
                                avatarUrl: profile.avatarUrl 
                            }
                        ]
                    };
                }
                addConversation(conversation);
            }

            onClose();
            // Let useChatPageNavigation handle the state switch based on URL
            navigate(`/channels/@me/${conversation.id}`);
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
              <div className="bg-floating h-[500px] animate-pulse flex flex-col">
                  <div className="h-32 bg-secondary w-full" />
                  <div className="px-6 -mt-14">
                      <div className="w-28 h-28 rounded-full bg-secondary border-[6px] border-floating" />
                      <div className="mt-4 h-8 w-40 bg-secondary rounded" />
                  </div>
              </div>
          </Modal>
      );
  }

  if (!profile) return null;

  return (
    <Modal isOpen={!!userId} onClose={onClose} size="lg">
      <div className="bg-floating flex flex-col text-zinc-100 min-h-[460px] animate-in fade-in duration-200 font-sans shadow-2xl rounded-lg overflow-hidden relative">
         <ProfileHeader 
            profile={profile} 
            isOnline={isOnline} 
            friendStatus={friendStatus}
            isMe={isMe}
            isBot={profile.isBot}
            actions={actions}
            actionLoading={actionLoading}
            onClose={onClose}
         />
         <ProfileInfo 
            profile={profile} 
            isMe={isMe}
            badges={badges}
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