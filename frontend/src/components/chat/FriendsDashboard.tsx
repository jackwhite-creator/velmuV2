import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuthStore } from '../../store/authStore';
import { useFriendStore, FriendRequest } from '../../store/friendStore';
import { useServerStore } from '../../store/serverStore';
import api from '../../lib/api';
import UserProfileModal from '../user-profile/UserProfileModal';
import ConfirmModal from '../ui/ConfirmModal';

interface FriendsDashboardProps {
  onUserContextMenu: (e: React.MouseEvent, user: any) => void;
  onMobileBack: () => void; // AJOUT
  showMobileSidebar: boolean; // AJOUT
}

export default function FriendsDashboard({ onUserContextMenu, onMobileBack, showMobileSidebar }: FriendsDashboardProps) {
  const navigate = useNavigate(); 
  const { user } = useAuthStore();
  const { requests, updateRequest, removeRequest, addRequest } = useFriendStore();
  const { onlineUsers, setActiveConversation, setActiveServer, addConversation } = useServerStore();

  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
  const [addUsername, setAddUsername] = useState('');
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<{ id: string, name: string } | null>(null);

  const getFriend = (req: FriendRequest) => {
    if (!req.sender || !req.receiver) return null;
    return req.senderId === user?.id ? req.receiver : req.sender;
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStatus(null);
    try {
      const res = await api.post('/friends/request', { usernameString: addUsername });
      addRequest(res.data); 
      setAddStatus({ type: 'success', msg: `Demande envoyée à ${addUsername} !` });
      setAddUsername('');
    } catch (err: any) {
      setAddStatus({ type: 'error', msg: err.response?.data?.error || "Erreur" });
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      updateRequest(requestId, 'ACCEPTED');
      await api.post('/friends/respond', { requestId, action: 'ACCEPT' });
    } catch (e) { console.error(e); }
  };

  const handleDecline = async (requestId: string) => {
    removeRequest(requestId);
    try {
      await api.delete(`/friends/${requestId}`);
    } catch (e) { console.error("Erreur suppression demande", e); }
  };

  const confirmDeleteFriend = (requestId: string, friendName: string) => {
    setFriendToDelete({ id: requestId, name: friendName });
    setConfirmOpen(true);
  };

  const handleDeleteFriend = async () => {
    if (!friendToDelete) return;
    
    const idToDelete = friendToDelete.id;
    
    setConfirmOpen(false);
    setFriendToDelete(null);
    removeRequest(idToDelete);

    try {
      await api.delete(`/friends/${idToDelete}`);
    } catch (e) { console.error(e); }
  };

  const startDM = async (targetUserId: string) => {
    try {
      const res = await api.post('/conversations', { targetUserId });
      addConversation(res.data);
      setActiveServer(null);
      setActiveConversation(res.data);
      navigate(`/channels/@me/${res.data.id}`);
    } catch (e) { console.error(e); }
  };

  const handleItemClick = (friendId: string) => {
      if (activeTab === 'pending') {
          setViewProfileId(friendId);
      } else {
          startDM(friendId);
      }
  };

  const friends = requests.filter(r => r.status === 'ACCEPTED');
  const pending = requests.filter(r => r.status === 'PENDING');

  const displayedList = () => {
    if (activeTab === 'online') {
      return friends.filter(r => {
        const f = getFriend(r);
        return f && onlineUsers.has(f.id);
      });
    }
    if (activeTab === 'all') return friends;
    if (activeTab === 'pending') return pending;
    return [];
  };

  const tabClass = (isActive: boolean) => `
    px-3 py-1.5 mx-1 rounded-sm transition font-medium text-sm cursor-pointer select-none whitespace-nowrap
    ${isActive 
      ? 'bg-background-modifier-selected text-text-header' 
      : 'text-text-muted hover:bg-background-modifier-hover hover:text-text-normal'}
  `;

  return (
    <div className="flex-1 flex flex-col bg-background-primary min-w-0 font-sans h-full">
      
      {/* HEADER AMIS MOBILE-FRIENDLY */}
      <div className="h-12 border-b border-background-tertiary flex items-center px-4 shadow-sm flex-shrink-0 bg-background-primary z-10 select-none overflow-x-auto scrollbar-none">
        
        {/* Bouton Hamburger Mobile */}
        <button onClick={onMobileBack} className="mr-3 md:hidden text-text-muted hover:text-text-normal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <div className="flex items-center gap-2 mr-4 text-text-header font-bold text-base whitespace-nowrap">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted hidden sm:block">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
           </svg>
           <span>Amis</span>
        </div>

        <div className="w-[1px] h-6 bg-background-tertiary mx-2 hidden sm:block"></div>

        <div className="flex items-center">
           <button onClick={() => setActiveTab('online')} className={tabClass(activeTab === 'online')}>En ligne</button>
           <button onClick={() => setActiveTab('all')} className={tabClass(activeTab === 'all')}>Tous</button>
           <button onClick={() => setActiveTab('pending')} className={tabClass(activeTab === 'pending')}>
             En attente {pending.length > 0 && <span className="bg-status-danger text-white text-[10px] font-bold px-1.5 rounded-sm ml-1.5 align-middle">{pending.length}</span>}
           </button>
           <button onClick={() => setActiveTab('add')} className={`ml-2 px-4 py-1.5 rounded-sm transition font-medium text-sm whitespace-nowrap ${activeTab === 'add' ? 'text-status-green bg-transparent' : 'bg-status-green text-white hover:bg-opacity-80'}`}>Ajouter un ami</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
         <div className="flex-1 px-4 lg:px-8 pt-6 pb-4 overflow-y-auto custom-scrollbar">
            
            {activeTab === 'add' ? (
               <div className="max-w-2xl border-b border-background-tertiary pb-6">
                  <h2 className="text-text-header font-bold text-base mb-2 uppercase tracking-wide">Ajouter un ami</h2>
                  <p className="text-text-muted text-sm mb-4">Tu peux ajouter des amis grâce à leur pseudo Velmu (ex: Pseudo#0000).</p>
                  
                  <form onSubmit={handleAddFriend} className="relative">
                     <div className={`flex items-center bg-background-tertiary border rounded-sm px-4 py-3 transition-colors ${addStatus?.type === 'success' ? 'border-status-green' : addStatus?.type === 'error' ? 'border-status-danger' : 'border-black/20 focus-within:border-brand'}`}>
                        <input 
                            value={addUsername}
                            onChange={e => setAddUsername(e.target.value)}
                            placeholder="Tu peux ajouter des amis avec leur pseudo Velmu"
                            className="flex-1 bg-transparent text-text-normal focus:outline-none placeholder-text-muted/70 font-medium"
                            autoFocus
                        />
                        <button type="submit" disabled={!addUsername} className="bg-brand hover:bg-brand-hover disabled:bg-background-modifier-selected disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ml-2">
                           Envoyer
                        </button>
                     </div>
                     {addStatus && <p className={`text-sm mt-2 font-medium ${addStatus.type === 'success' ? 'text-status-green' : 'text-status-danger'}`}>{addStatus.msg}</p>}
                  </form>
               </div>
            ) : (
               <div className="flex flex-col h-full">
                  <div className="text-xs font-bold text-text-muted uppercase mb-3 ml-2 tracking-wide flex items-center">
                     {activeTab === 'online' ? `En ligne — ${displayedList().length}` : 
                      activeTab === 'all' ? `Tous les amis — ${displayedList().length}` : 
                      `En attente — ${displayedList().length}`}
                  </div>

                  {displayedList().length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full pb-20 opacity-60 select-none">
                        <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mb-6 grayscale opacity-50">
                             <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                             </svg>
                        </div>
                        <p className="text-text-muted text-sm font-medium">C'est bien calme par ici...</p>
                     </div>
                  ) : (
                     <div className="pb-4">
                        {displayedList().map((req) => {
                           const friend = getFriend(req);
                           if (!friend) return null;

                           const isOnline = onlineUsers.has(friend.id);
                           const isIncoming = req.receiverId === user?.id && req.status === 'PENDING';

                           return (
                              <div 
                                 key={req.id} 
                                 className="group flex items-center justify-between p-2.5 rounded-sm border-t border-white/10 hover:border-transparent hover:bg-background-modifier-hover transition-colors cursor-pointer select-none -mx-2 px-4" 
                                 onClick={() => handleItemClick(friend.id)} 
                                 onContextMenu={(e) => onUserContextMenu(e, friend)}
                              >
                                 <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <div className="relative flex-shrink-0">
                                       <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-text-header font-bold text-xs overflow-hidden">
                                          {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" alt={friend.username} /> : friend.username[0].toUpperCase()}
                                       </div>
                                       {activeTab !== 'pending' && (
                                            <div className="absolute -bottom-0.5 -right-0.5 bg-background-primary rounded-full p-[2px]">
                                                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-status-green' : 'bg-background-tertiary border-2 border-text-muted'}`}></div>
                                            </div>
                                       )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-text-header text-sm truncate">{friend.username}</span>
                                          <span className="text-xs text-text-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">#{friend.discriminator}</span>
                                       </div>
                                       <div className="text-[11px] text-text-muted font-medium truncate">
                                          {req.status === 'PENDING' ? (isIncoming ? "Demande d'ami reçue" : "Demande d'ami envoyée") : (isOnline ? "En ligne" : "Hors ligne")}
                                       </div>
                                    </div>
                                 </div>
                                 
                                 <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    {req.status === 'ACCEPTED' && (
                                       <>
                                           <button onClick={(e) => { e.stopPropagation(); startDM(friend.id); }} className="w-9 h-9 rounded-full bg-background-secondary text-text-muted hover:text-text-normal hover:bg-background-tertiary transition flex items-center justify-center shadow-sm" title="Message">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                           </button>
                                           <button onClick={(e) => { e.stopPropagation(); confirmDeleteFriend(req.id, friend.username); }} className="w-9 h-9 rounded-full bg-background-secondary text-text-muted hover:text-status-danger hover:bg-background-tertiary transition flex items-center justify-center shadow-sm" title="Retirer">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                           </button>
                                       </>
                                    )}
                                    {isIncoming && (
                                       <>
                                         <button onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }} className="w-9 h-9 rounded-full bg-background-secondary text-status-green hover:text-white hover:bg-status-green transition flex items-center justify-center" title="Accepter"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                                         <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-9 h-9 rounded-full bg-background-secondary text-status-danger hover:text-white hover:bg-status-danger transition flex items-center justify-center" title="Refuser"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                       </>
                                    )}
                                    {(req.status === 'PENDING' && !isIncoming) && (
                                       <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-9 h-9 rounded-full bg-background-secondary text-text-muted hover:text-status-danger hover:bg-background-tertiary transition flex items-center justify-center" title="Annuler"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            )}
         </div>

         <div className="w-[360px] bg-background-primary border-l border-background-tertiary hidden xl:flex flex-col p-4">
            <h3 className="text-xl font-extrabold text-text-header mb-6 mt-2 ml-2">En ligne maintenant</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-100 select-none px-4">
               <div className="text-center">
                  <p className="text-text-header font-bold text-base mb-1">C'est calme pour l'instant...</p>
                  <p className="text-text-muted text-sm">Quand un ami commence une activité, elle s'affichera ici !</p>
               </div>
            </div>
         </div>
      </div>

      <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} onOpenSettings={() => {}} />

      <ConfirmModal 
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteFriend}
        title={`Retirer ${friendToDelete?.name}`}
        message={`Es-tu sûr de vouloir retirer ${friendToDelete?.name} de ta liste d'amis ?`}
        isDestructive={true}
        confirmText="Retirer l'ami"
      />

    </div>
  );
}