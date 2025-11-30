import { useState, useEffect } from 'react';
import { useFriendStore } from '../../../store/friendStore';
import { useServerStore } from '../../../store/serverStore';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Modal from '../../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serverId: string | null;
}

export default function InviteFriendsModal({ isOpen, onClose, serverId }: Props) {
  const { user } = useAuthStore();
  const { requests } = useFriendStore();
  const { onlineUsers } = useServerStore();
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInvitedFriends(new Set());
      setSearchTerm('');
    }
  }, [isOpen]);

  const friends = requests
    .filter(req => req.status === 'ACCEPTED')
    .map(req => {
      const friend = req.senderId === user?.id ? req.receiver : req.sender;
      return {
        ...friend,
        isOnline: onlineUsers.has(friend.id)
      };
    })
    .filter(friend => 
      friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.discriminator.includes(searchTerm)
    );

  const handleInvite = async (friendId: string) => {
    if (!serverId || invitedFriends.has(friendId)) return;

    try {
      // 1. Create invite link
      const inviteRes = await api.post('/invites/create', { 
        serverId, 
        maxUses: 0, 
        expiresIn: 86400 // 24h
      });
      const inviteCode = inviteRes.data.code;
      const inviteLink = `${window.location.origin}/invite/${inviteCode}`;

      // 2. Get or create DM conversation
      const convRes = await api.post('/conversations', { targetUserId: friendId });
      const conversationId = convRes.data.id;

      // 3. Send message with invite
      await api.post('/messages', {
        conversationId,
        content: `Rejoins-moi sur mon nouveau serveur !\n${inviteLink}`
      });

      // 4. Mark as invited
      setInvitedFriends(prev => {
        const newSet = new Set(prev);
        newSet.add(friendId);
        return newSet;
      });

    } catch (err) {
      console.error("Erreur lors de l'invitation", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col h-[500px] bg-background-primary rounded-lg overflow-hidden font-sans text-text-normal">
        
        {/* Header */}
        <div className="p-6 border-b border-background-tertiary">
          <h2 className="text-xl font-bold text-text-header mb-1">Inviter des amis</h2>
          <p className="text-text-muted text-sm">
            Choisis les amis que tu veux inviter sur ton nouveau serveur !
          </p>
          
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Rechercher des amis"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background-tertiary border border-background-secondary rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-brand transition-colors placeholder-text-muted"
            />
            <div className="absolute right-3 top-2.5 text-text-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-70">
              <p className="text-sm font-medium">Aucun ami trouvé...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {friends.map(friend => {
                const isInvited = invitedFriends.has(friend.id);
                return (
                  <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-background-modifier-hover rounded-sm group transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center overflow-hidden">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-text-header">{friend.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background-primary ${friend.isOnline ? 'bg-status-green' : 'bg-text-muted'}`}></div>
                      </div>
                      <div>
                        <div className="font-semibold text-text-header text-sm flex items-center gap-1">
                            {friend.username}
                            <span className="text-xs text-text-muted font-normal opacity-0 group-hover:opacity-100 transition-opacity">#{friend.discriminator}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInvite(friend.id)}
                      disabled={isInvited}
                      className={`px-4 py-1.5 rounded-sm text-xs font-medium transition-all border ${
                        isInvited
                          ? 'bg-transparent border-status-green text-status-green cursor-default'
                          : 'bg-brand border-brand text-white hover:bg-brand-hover hover:border-brand-hover'
                      }`}
                    >
                      {isInvited ? 'Invité' : 'Inviter'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-background-secondary border-t border-background-tertiary flex justify-end">
             <button onClick={onClose} className="text-sm font-medium text-text-normal hover:underline">
                Terminer
             </button>
        </div>

      </div>
    </Modal>
  );
}
