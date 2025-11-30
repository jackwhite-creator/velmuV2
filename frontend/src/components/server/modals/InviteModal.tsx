import { useState, useEffect, useCallback } from 'react';
import { Server, useServerStore } from '../../../store/serverStore';
import { useFriendStore } from '../../../store/friendStore';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Modal from '../../ui/Modal';

interface Props {
  isOpen: boolean;
  server: Server | null;
  onClose: () => void;
}

const EXPIRE_OPTIONS = [
    { label: '30 minutes', value: 1800 },
    { label: '1 heure', value: 3600 },
    { label: '6 heures', value: 21600 },
    { label: '12 heures', value: 43200 },
    { label: '1 jour', value: 86400 },
    { label: '7 jours', value: 604800 },
    { label: 'Jamais', value: 0 },
];

const USES_OPTIONS = [
    { label: 'Illimité', value: 0 },
    { label: '1 utilisation', value: 1 },
    { label: '5 utilisations', value: 5 },
    { label: '10 utilisations', value: 10 },
    { label: '25 utilisations', value: 25 },
    { label: '50 utilisations', value: 50 },
    { label: '100 utilisations', value: 100 },
];

export default function InviteModal({ isOpen, server, onClose }: Props) {
  const { user } = useAuthStore();
  const { requests } = useFriendStore();
  const { onlineUsers } = useServerStore();
  
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [expiresIn, setExpiresIn] = useState(604800);
  const [maxUses, setMaxUses] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());

  // Friend list logic
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

  const generateInvite = useCallback(async () => {
    if (!server) return;
    setIsLoading(true);
    setPermissionDenied(false);
    try {
      const res = await api.post('/invites/create', { 
          serverId: server.id,
          expiresIn,
          maxUses
      });
      setInviteCode(res.data.code);
    } catch (error: any) {
      console.error("Erreur génération invitation", error);
      if (error.response?.status === 403) {
          setPermissionDenied(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [server, expiresIn, maxUses]);

  useEffect(() => {
    if (isOpen && server) {
      generateInvite();
      setInvitedFriends(new Set());
      setSearchTerm('');
      setShowSettings(false);
    } else {
      setInviteCode('');
      setCopied(false);
      setExpiresIn(604800);
      setMaxUses(0);
    }
  }, [isOpen, server, generateInvite]);

  const handleInviteFriend = async (friendId: string) => {
    if (!server || invitedFriends.has(friendId)) return;

    try {
      // 1. Create invite link (standard 24h, 1 use for direct invite)
      const inviteRes = await api.post('/invites/create', { 
        serverId: server.id, 
        maxUses: 1, 
        expiresIn: 86400 
      });
      const code = inviteRes.data.code;
      const link = `${window.location.origin}/invite/${code}`;

      // 2. Get or create conversation
      const convRes = await api.post('/conversations', { targetUserId: friendId });
      const conversationId = convRes.data.id;

      // 3. Send message
      await api.post('/messages', {
        conversationId,
        content: `Rejoins-moi sur **${server.name}** !\n${link}`
      });

      // 4. Update state
      setInvitedFriends(prev => {
        const newSet = new Set(prev);
        newSet.add(friendId);
        return newSet;
      });

    } catch (err) {
      console.error("Erreur invitation ami", err);
    }
  };

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!server) return null;

  if (permissionDenied) {
      return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="p-6 bg-background-floating flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Permission Refusée</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Vous n'avez pas la permission de créer des invitations pour ce serveur.
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-2 bg-brand hover:bg-brand-hover text-white rounded-md font-medium transition-colors"
                >
                    Compris
                </button>
            </div>
        </Modal>
      );
  }

  const fullLink = inviteCode ? `${window.location.origin}/invite/${inviteCode}` : 'Chargement...';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col h-[550px] bg-background-primary rounded-lg overflow-hidden font-sans text-text-normal">
        
        {/* Header */}
        <div className="p-4 pb-4">
          <h2 className="text-xl font-bold text-text-header mb-1">Inviter des amis sur {server.name}</h2>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
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
                      onClick={() => handleInviteFriend(friend.id)}
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

        {/* Footer - Link Generation */}
        <div className="p-4 bg-background-secondary border-t border-background-tertiary">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-2">Ou envoyer un lien d'invitation au serveur</h3>
            <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-background-tertiary border border-background-secondary rounded-sm px-3 py-2 text-sm text-text-normal truncate select-all">
                    {fullLink}
                </div>
                <button 
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors min-w-[80px] ${copied ? 'bg-status-green text-white' : 'bg-brand text-white hover:bg-brand-hover'}`}
                >
                    {copied ? 'Copié' : 'Copier'}
                </button>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="text-xs text-text-muted">
                    Ton lien d'invitation expire dans <span className="font-bold text-text-normal">{EXPIRE_OPTIONS.find(o => o.value === expiresIn)?.label}</span>.
                </div>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-xs text-brand hover:underline"
                >
                    Modifier le lien d'invitation
                </button>
            </div>

            {/* Settings Toggle */}
            {showSettings && (
                <div className="mt-4 pt-4 border-t border-background-modifier-accent grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Expire après</label>
                        <select 
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(Number(e.target.value))}
                            className="w-full bg-background-tertiary border border-background-secondary rounded-sm p-2 text-sm text-text-normal focus:outline-none focus:border-brand"
                        >
                            {EXPIRE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Nombre max. d'utilisations</label>
                        <select 
                            value={maxUses}
                            onChange={(e) => setMaxUses(Number(e.target.value))}
                            className="w-full bg-background-tertiary border border-background-secondary rounded-sm p-2 text-sm text-text-normal focus:outline-none focus:border-brand"
                        >
                            {USES_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>

      </div>
    </Modal>
  );
}