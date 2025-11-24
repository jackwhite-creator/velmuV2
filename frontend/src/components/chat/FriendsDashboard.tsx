import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFriendStore, FriendRequest } from '../../store/friendStore';
import { useServerStore } from '../../store/serverStore';
import api from '../../lib/api';
import UserProfileModal from '../UserProfileModal';
import ConfirmModal from '../ui/ConfirmModal';

interface FriendsDashboardProps {
  onUserContextMenu: (e: React.MouseEvent, user: any) => void;
}

export default function FriendsDashboard({ onUserContextMenu }: FriendsDashboardProps) {
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
    removeRequest(friendToDelete.id);
    setConfirmOpen(false);
    try {
      await api.delete(`/friends/${friendToDelete.id}`);
    } catch (e) { console.error(e); }
  };

  const startDM = async (targetUserId: string) => {
    try {
      const res = await api.post('/conversations', { targetUserId });
      addConversation(res.data);
      setActiveServer(null);
      setActiveConversation(res.data);
    } catch (e) { console.error(e); }
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

  // ✅ STYLE "BLOC" : Boutons carrés (rounded-sm), couleurs ternes
  const tabClass = (isActive: boolean, color: string = 'bg-zinc-600 text-white') => `
    px-3 py-1 rounded-sm transition font-medium text-sm
    ${isActive ? color : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
  `;

  return (
    // Fond #313338 (Gris foncé standard), Police Sans
    <div className="flex-1 flex flex-col bg-[#313338] min-w-0 font-sans">
      
      {/* HEADER COMPACT */}
      <div className="h-12 border-b border-[#26272d] flex items-center px-4 shadow-sm flex-shrink-0 bg-[#313338] z-10 select-none">
        <div className="flex items-center gap-2 mr-4 pr-4 border-r border-zinc-700/50 text-zinc-200 font-bold text-base">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           Amis
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setActiveTab('online')} className={tabClass(activeTab === 'online')}>En ligne</button>
           <button onClick={() => setActiveTab('all')} className={tabClass(activeTab === 'all')}>Tous</button>
           <button onClick={() => setActiveTab('pending')} className={tabClass(activeTab === 'pending')}>
             En attente {pending.length > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm ml-1.5">{pending.length}</span>}
           </button>
           <button onClick={() => setActiveTab('add')} className={`ml-2 px-3 py-1 rounded-sm transition font-medium text-sm ${activeTab === 'add' ? 'text-emerald-400 bg-transparent' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>Ajouter un ami</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
         {/* COLONNE PRINCIPALE */}
         <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'add' ? (
               <div className="max-w-2xl border-b border-zinc-700 pb-6">
                  <h2 className="text-white font-bold text-lg mb-1 uppercase text-sm tracking-wide">Ajouter un ami</h2>
                  <p className="text-zinc-400 text-xs mb-4">Tu peux ajouter des amis grâce à leur pseudo Velmu (ex: Pseudo#0000).</p>
                  
                  {/* Formulaire "Brut" : Bordures visibles, fond noir */}
                  <form onSubmit={handleAddFriend} className="relative flex gap-2 items-center">
                     <div className="flex-1 bg-[#1e1f22] border border-[#1e1f22] focus-within:border-emerald-500 rounded-sm p-1 transition-colors">
                        <input 
                            value={addUsername}
                            onChange={e => setAddUsername(e.target.value)}
                            placeholder="Tu peux ajouter des amis avec leur pseudo Velmu"
                            className="w-full bg-transparent px-3 py-2 text-white focus:outline-none placeholder-zinc-500 text-sm"
                            autoFocus
                        />
                     </div>
                     <button type="submit" disabled={!addUsername} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                        Envoyer
                     </button>
                  </form>
                  {addStatus && <p className={`text-xs mt-3 font-medium ${addStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{addStatus.msg}</p>}
               </div>
            ) : (
               <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-500 uppercase mb-4 pb-2 border-b border-zinc-700 tracking-wide">
                     {activeTab === 'online' ? `En ligne — ${displayedList().length}` : 
                      activeTab === 'all' ? `Tous les amis — ${displayedList().length}` : 
                      `En attente — ${displayedList().length}`}
                  </div>

                  {displayedList().length === 0 ? (
                     // ✅ EMPTY STATE "BLOC" : Simple, statique, centré
                     <div className="flex flex-col items-center justify-center h-full pb-20 opacity-50 select-none">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4 grayscale">
                           <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">C'est le calme plat.</p>
                     </div>
                  ) : (
                     displayedList().map(req => {
                        const friend = getFriend(req);
                        if (!friend) return null;

                        const isOnline = onlineUsers.has(friend.id);
                        const isIncoming = req.receiverId === user?.id && req.status === 'PENDING';

                        return (
                           <div 
                              key={req.id} 
                              // ✅ ITEM "BLOC" : Border-top fine, effet hover simple
                              className="group flex items-center justify-between p-2.5 rounded-sm hover:bg-zinc-700/40 border-t border-zinc-800 hover:border-transparent transition-colors cursor-pointer select-none" 
                              onClick={() => setViewProfileId(friend.id)}
                              onContextMenu={(e) => onUserContextMenu(e, friend)}
                           >
                              <div className="flex items-center gap-3 flex-1">
                                 <div className="relative">
                                    {/* Avatar Rond w-9 */}
                                    <div className="w-9 h-9 rounded-full bg-zinc-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                                       {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" alt={friend.username} /> : friend.username[0].toUpperCase()}
                                    </div>
                                    {activeTab !== 'pending' && (
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[2.5px] border-[#313338] rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`}></div>
                                    )}
                                 </div>
                                 <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                       <span className="font-semibold text-zinc-200 text-sm">{friend.username}</span>
                                       <span className="text-[10px] text-zinc-500 font-medium opacity-0 group-hover:opacity-100 transition">#{friend.discriminator}</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 font-medium">
                                       {req.status === 'PENDING' ? (isIncoming ? "Demande reçue" : "Demande envoyée") : (isOnline ? "En ligne" : "Hors ligne")}
                                    </div>
                                 </div>
                              </div>
                              
                              {/* BOUTONS D'ACTION : Ronds, fond sombre */}
                              <div className="flex gap-2">
                                 {req.status === 'ACCEPTED' && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); startDM(friend.id); }} className="w-8 h-8 rounded-full bg-[#1e1f22] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600 transition flex items-center justify-center" title="Message"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                                        <button onClick={(e) => { e.stopPropagation(); confirmDeleteFriend(req.id, friend.username); }} className="w-8 h-8 rounded-full bg-[#1e1f22] text-zinc-400 hover:text-red-400 hover:bg-zinc-600 transition flex items-center justify-center" title="Retirer"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </>
                                 )}
                                 {isIncoming && (
                                    <>
                                      <button onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }} className="w-8 h-8 rounded-full bg-[#1e1f22] text-emerald-500 hover:text-white hover:bg-emerald-600 transition flex items-center justify-center" title="Accepter"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-8 h-8 rounded-full bg-[#1e1f22] text-red-500 hover:text-white hover:bg-red-600 transition flex items-center justify-center" title="Refuser"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </>
                                 )}
                                 {(req.status === 'PENDING' && !isIncoming) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-8 h-8 rounded-full bg-[#1e1f22] text-zinc-400 hover:text-red-400 hover:bg-zinc-600 transition flex items-center justify-center" title="Annuler"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                 )}
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            )}
         </div>

         {/* SIDEBAR DROITE "En ligne maintenant" - Fond légèrement plus clair/différent */}
         <div className="w-80 bg-[#2b2d31] border-l border-zinc-700/50 hidden 2xl:flex flex-col p-4">
            <h3 className="text-lg font-bold text-zinc-300 mb-4 uppercase text-xs tracking-wide">En ligne maintenant</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 select-none">
               <div className="w-full p-6 rounded-sm bg-[#26272d] border border-zinc-800 mb-2">
                  <p className="text-xs text-zinc-500 font-medium">C'est très calme par ici...</p>
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
        confirmText="Retirer"
      />

    </div>
  );
}