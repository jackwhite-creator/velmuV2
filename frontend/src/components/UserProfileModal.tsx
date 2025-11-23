import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import { useFriendStore } from '../store/friendStore';
import { useAuthStore } from '../store/authStore';
import Modal from './ui/Modal';
import Tooltip from './ui/Tooltip';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from './ui/ContextMenu';
import ConfirmModal from './ui/ConfirmModal';
import { AnimatePresence } from 'framer-motion';

const Icons = {
  UserPlus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  UserMinus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

interface UserProfileModalProps { userId: string | null; onClose: () => void; onOpenSettings: () => void; }
interface FullProfile { id: string; username: string; discriminator: string; avatarUrl: string | null; bannerUrl?: string | null; bio?: string | null; createdAt?: string; }

const FullSkeleton = () => (
  <div className="bg-slate-900 flex flex-col min-h-[500px] animate-pulse">
     <div className="h-40 w-full bg-slate-800" />
     <div className="px-8 relative">
        <div className="flex justify-between items-end -mt-16 mb-4">
           <div className="w-32 h-32 rounded-full bg-slate-900 p-[6px]"><div className="w-full h-full rounded-full bg-slate-700"></div></div>
           <div className="flex gap-3 mb-2"><div className="h-10 w-32 bg-slate-700 rounded-md"></div><div className="h-10 w-10 bg-slate-700 rounded-md"></div></div>
        </div>
        <div className="mb-6"><div className="h-9 w-48 bg-slate-700 rounded mb-2"></div><div className="h-4 w-32 bg-slate-700/50 rounded mt-2"></div></div>
     </div>
     <div className="px-8 border-b border-slate-800 flex gap-8"><div className="pb-3 w-24"><div className="h-4 bg-slate-700 rounded w-full"></div></div><div className="pb-3 w-32"><div className="h-4 bg-slate-700/50 rounded w-full"></div></div></div>
     <div className="flex-1 p-8 bg-slate-900/50 min-h-[250px]"><div className="h-3 w-24 bg-slate-700/50 rounded mb-3"></div><div className="space-y-2"><div className="h-3 w-full bg-slate-700/30 rounded"></div><div className="h-3 w-[90%] bg-slate-700/30 rounded"></div></div></div>
  </div>
);

const BioSkeleton = () => (
  <div className="animate-pulse space-y-4">
      <div className="h-4 w-32 bg-slate-700/50 rounded"></div>
      <div className="space-y-2">
          <div className="h-3 w-full bg-slate-700/30 rounded"></div>
          <div className="h-3 w-[90%] bg-slate-700/30 rounded"></div>
          <div className="h-3 w-[60%] bg-slate-700/30 rounded"></div>
      </div>
  </div>
);

export default function UserProfileModal({ userId, onClose, onOpenSettings }: UserProfileModalProps) {
  const navigate = useNavigate();
  const { onlineUsers, addConversation, setActiveConversation, setActiveServer, activeServer, conversations } = useServerStore();
  const { requests, addRequest, updateRequest, removeRequest } = useFriendStore(); 
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'mutual_servers' | 'mutual_friends'>('info');
  
  const [menuState, setMenuState] = useState<{ x: number; y: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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
  
  const handleEditProfile = () => { onClose(); onOpenSettings(); };

  const handleStartDM = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await api.post('/conversations', { targetUserId: profile.id });
      addConversation(res.data);
      setActiveServer(null);
      setActiveConversation(res.data);
      onClose();
      navigate('/channels/@me');
    } catch (err) { console.error(err); } 
    finally { setActionLoading(false); }
  };
  const handleSendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await api.post('/friends/request', { username: profile.username, discriminator: profile.discriminator });
      addRequest(res.data);
    } catch (error) { console.error(error); } finally { setActionLoading(false); }
  };
  const handleAcceptRequest = async () => {
    const request = requests.find(r => r.senderId === userId && r.receiverId === currentUser?.id);
    if (!request) return;
    setActionLoading(true);
    try {
        await api.post('/friends/respond', { requestId: request.id, action: 'ACCEPT' });
        updateRequest(request.id, 'ACCEPTED');
    } catch (error) { console.error(error); } finally { setActionLoading(false); }
  };
  const handleDeclineRequest = async () => {
    const request = requests.find(r => r.senderId === userId && r.receiverId === currentUser?.id);
    if (!request) return;
    removeRequest(request.id);
    try { await api.delete(`/friends/${request.id}`); } catch(err) { console.error(err); }
  };
  const handleToggleMenu = () => {
    if (menuState) { setMenuState(null); return; }
    if (menuButtonRef.current) { const rect = menuButtonRef.current.getBoundingClientRect(); setMenuState({ x: rect.left, y: rect.bottom + 8 }); }
  };
  const handleRemoveFriend = () => { setMenuState(null); setConfirmRemoveOpen(true); };
  const handleCancelRequest = async () => {
    const request = requests.find(r => r.senderId === currentUser?.id && r.receiverId === userId);
    if (!request) return;
    removeRequest(request.id);
    setMenuState(null);
    try { await api.delete(`/friends/${request.id}`); } catch(err) { console.error(err); }
  };
  const performRemoveFriend = async () => {
    const request = requests.find(r => friendStatus === 'FRIEND' && ((r.senderId === currentUser?.id && r.receiverId === userId) || (r.senderId === userId && r.receiverId === currentUser?.id)));
    if (!request) return;
    removeRequest(request.id);
    try { await api.delete(`/friends/${request.id}`); } catch(err) { console.error(err); }
  };

  const renderActionButton = () => {
    if (!profile) return null;
    const btnBase = "px-6 py-2.5 rounded-md font-semibold text-sm transition shadow-md flex items-center justify-center gap-2";

    switch (friendStatus) {
      case 'ME': return <button onClick={handleEditProfile} className={`${btnBase} bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200`}> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Modifier le profil </button>;
      case 'FRIEND': return <button onClick={handleStartDM} className={`${btnBase} bg-indigo-600 hover:bg-indigo-500 text-white w-full md:w-auto`}> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Message </button>;
      case 'RECEIVED': return (
          <div className="flex gap-3">
            <button onClick={handleAcceptRequest} disabled={actionLoading} className={`${btnBase} bg-emerald-600 hover:bg-emerald-500 text-white`}>{actionLoading ? '...' : 'Accepter'}</button>
            <button onClick={handleDeclineRequest} className={`${btnBase} bg-slate-700 hover:bg-slate-600 text-slate-200`}>Refuser</button>
          </div>
      );
      case 'SENT': return <button disabled className={`${btnBase} bg-slate-700 text-slate-300 cursor-default border border-slate-600`}>Demande envoyée</button>;
      case 'NONE': default: return <button onClick={handleSendRequest} disabled={actionLoading} className={`${btnBase} bg-green-600 hover:bg-green-500 text-white`}>Ajouter en ami</button>;
    }
  };

  const showFullSkeleton = loading && !profile;

  return (
    <Modal isOpen={!!userId} onClose={onClose} size="lg">
      {showFullSkeleton ? ( 
        <FullSkeleton />
      ) : 
      profile ? (
        <div className="bg-slate-900 flex flex-col text-slate-100 min-h-[500px] animate-in fade-in duration-200">
          {/* ✅ CORRECTION ICI : bg-indigo-500 remplacé par bg-slate-800 */}
          <div className="h-40 w-full bg-slate-800 relative overflow-hidden">
             {profile.bannerUrl && <img src={profile.bannerUrl} className="w-full h-full object-cover animate-in fade-in duration-300" alt="Bannière" />}
             <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition backdrop-blur-sm">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
          </div>
          <div className="px-8 relative">
             <div className="flex justify-between items-end -mt-16 mb-4">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-slate-900 p-[6px]"><div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold text-white overflow-hidden ring-1 ring-slate-600/50">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : profile.username[0].toUpperCase()}</div></div>
                    <div className={`absolute bottom-2 right-2 w-8 h-8 border-[6px] border-slate-900 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </div>
                <div className="flex gap-3 mb-2">
                    {renderActionButton()}
                    {!isMe && (
                      <Tooltip text="Plus" side="top">
                        <button ref={menuButtonRef} onClick={handleToggleMenu} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 p-2.5 rounded-md transition shadow-sm">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                      </Tooltip>
                    )}
                </div>
             </div>
             <div className="mb-6">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-white">{profile.username}</h2>
                    <span className="text-xl text-slate-500 font-normal">#{profile.discriminator}</span>
                </div>
                {profile.createdAt ? (
                    <p className="text-sm text-slate-400 mt-2">Membre depuis le {new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ) : (
                    <div className="h-4 w-32 bg-slate-700/50 rounded mt-2 animate-pulse"></div>
                )}
             </div>
          </div>
          <div className="px-8 border-b border-slate-800 flex gap-8">
              <button onClick={() => setActiveTab('info')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'info' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>Info utilisateur{activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full"></div>}</button>
              {!isMe && (
                  <>
                      <button onClick={() => setActiveTab('mutual_servers')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'mutual_servers' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>Serveurs en commun{activeTab === 'mutual_servers' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full"></div>}</button>
                      <button onClick={() => setActiveTab('mutual_friends')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'mutual_friends' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>Amis en commun{activeTab === 'mutual_friends' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full"></div>}</button>
                  </>
              )}
          </div>
          <div className="flex-1 p-8 bg-slate-900/50 min-h-[250px]">
             {activeTab === 'info' && ( 
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wide">À propos de moi</h3>
                        {profile.bio !== undefined ? (
                             <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio || "Cet utilisateur préfère rester mystérieux..."}</p>
                        ) : (
                             <BioSkeleton />
                        )}
                    </div>
                 </div> 
             )}
             {activeTab === 'mutual_servers' && ( <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"><div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800 transition cursor-pointer"><div className="w-10 h-10 rounded-[14px] bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">VL</div><div><div className="text-white font-medium">Velmu Serveur</div><div className="text-xs text-slate-400">Serveur Principal</div></div></div></div> )}
             {activeTab === 'mutual_friends' && ( <div className="flex flex-col items-center justify-center py-8 opacity-60 animate-in fade-in slide-in-from-bottom-2 duration-200"><svg className="w-12 h-12 text-slate-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><div className="text-slate-400 text-sm font-medium">Aucun ami en commun</div></div> )}
          </div>
        </div>
      ) : null}
      
      <AnimatePresence>
        {menuState && (
          <ContextMenu position={menuState} onClose={() => setMenuState(null)}>
            {friendStatus === 'FRIEND' && <ContextMenuItem label="Retirer l'ami" variant="danger" icon={Icons.UserMinus} onClick={handleRemoveFriend} />}
            {friendStatus === 'NONE' && <ContextMenuItem label="Ajouter en ami" icon={Icons.UserPlus} onClick={() => { handleSendRequest(); setMenuState(null); }} />}
            {friendStatus === 'SENT' && <ContextMenuItem label="Annuler la demande" variant="danger" icon={Icons.UserMinus} onClick={handleCancelRequest} />}
            <ContextMenuSeparator />
            <ContextMenuItem label="Copier le nom d'utilisateur" icon={Icons.Copy} onClick={() => { navigator.clipboard.writeText(`${profile?.username}#${profile?.discriminator}`); setMenuState(null); }} />
          </ContextMenu>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmRemoveOpen} onClose={() => setConfirmRemoveOpen(false)} onConfirm={performRemoveFriend}
        title={`Retirer ${profile?.username}`}
        message="Es-tu sûr de vouloir retirer cet utilisateur de ta liste d'amis ?"
        isDestructive={true} confirmText="Retirer l'ami"
      />
    </Modal>
  );
}