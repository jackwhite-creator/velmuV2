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

  // ✅ NOUVEAU STYLE DES ONGLETS : Plus ronds, plus modernes (Pill shape)
  const tabClass = (isActive: boolean, color: string = 'bg-slate-100 text-slate-900') => `
    px-5 py-2 rounded-full transition-all font-medium text-sm border
    ${isActive 
        ? `${color} border-transparent shadow-md shadow-indigo-500/10` 
        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800'}
  `;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 min-w-0 font-sans">
      
      {/* HEADER MODERNE */}
      <div className="h-20 border-b border-slate-800 flex items-center px-8 shadow-sm flex-shrink-0 bg-slate-900/95 backdrop-blur-sm z-10 select-none">
        <div className="flex items-center gap-3 mr-8 pr-8 border-r border-slate-800 text-white font-bold text-xl tracking-tight">
           {/* Icône Personnes plus stylisée */}
           <div className="p-2 bg-slate-800 rounded-xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
           </div>
           <span>Espace Amis</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
           <button onClick={() => setActiveTab('online')} className={tabClass(activeTab === 'online')}>En ligne</button>
           <button onClick={() => setActiveTab('all')} className={tabClass(activeTab === 'all')}>Tous</button>
           <button onClick={() => setActiveTab('pending')} className={tabClass(activeTab === 'pending')}>
             En attente {pending.length > 0 && <span className="ml-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pending.length}</span>}
           </button>
           <button onClick={() => setActiveTab('add')} className={`ml-2 px-5 py-2 rounded-full transition font-medium text-sm border ${activeTab === 'add' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'bg-emerald-600 border-transparent text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'}`}>Ajouter un ami</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
         {/* LISTE PRINCIPALE */}
         <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'add' ? (
               <div className="max-w-2xl mt-8 mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-white font-bold text-3xl mb-3">Agrandis ton cercle</h2>
                    <p className="text-slate-400 text-base">Entre le pseudo Velmu de ton ami pour vous connecter.</p>
                  </div>
                  
                  <form onSubmit={handleAddFriend} className="relative group max-w-xl mx-auto">
                     <div className={`absolute inset-0 rounded-2xl opacity-20 blur transition duration-500 ${addStatus?.type === 'success' ? 'bg-emerald-500' : addStatus?.type === 'error' ? 'bg-red-500' : 'bg-indigo-500 group-focus-within:opacity-40 group-focus-within:blur-md'}`}></div>
                     <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-1 transition group-focus-within:border-indigo-500/50">
                        <input 
                            value={addUsername}
                            onChange={e => setAddUsername(e.target.value)}
                            placeholder="Exemple: Pseudo#0000"
                            className="flex-1 bg-transparent p-4 text-white focus:outline-none placeholder-slate-600 text-lg font-medium"
                            autoFocus
                        />
                        <button type="submit" disabled={!addUsername} className="bg-slate-800 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md mr-1">
                            Envoyer
                        </button>
                     </div>
                  </form>
                  {addStatus && (
                      <div className={`mt-6 text-center p-4 rounded-xl border ${addStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          {addStatus.type === 'success' ? (
                              <div className="flex items-center justify-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> {addStatus.msg}</div>
                          ) : (
                              <div className="flex items-center justify-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {addStatus.msg}</div>
                          )}
                      </div>
                  )}
               </div>
            ) : (
               <div className="space-y-4 max-w-5xl mx-auto">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-6 tracking-wider flex items-center gap-4">
                     <span>{activeTab === 'online' ? "En ligne" : activeTab === 'all' ? "Tous les amis" : "En attente"} — {displayedList().length}</span>
                     <div className="h-px bg-slate-800 flex-1"></div>
                  </div>

                  {displayedList().length === 0 ? (
                     // ✅ EMPTY STATE ORIGINAL : Plus de Wumpus ! Design abstrait "Radar"
                     <div className="flex flex-col items-center justify-center mt-24 opacity-60 select-none">
                        <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                           <div className="absolute inset-0 border-2 border-slate-800 rounded-full animate-[ping_3s_linear_infinite]"></div>
                           <div className="absolute inset-4 border-2 border-slate-800 rounded-full animate-[ping_3s_linear_infinite_1s]"></div>
                           <div className="absolute inset-8 border-2 border-slate-800 rounded-full"></div>
                           <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center relative z-10 shadow-xl">
                               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                           </div>
                        </div>
                        <h3 className="text-slate-300 text-lg font-semibold mb-2">C'est calme... trop calme.</h3>
                        <p className="text-slate-500 text-sm">Aucun signal détecté pour le moment.</p>
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
                              className="group flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 hover:bg-slate-800 border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer select-none" 
                              onClick={() => setViewProfileId(friend.id)}
                              onContextMenu={(e) => onUserContextMenu(e, friend)}
                           >
                              <div className="flex items-center gap-5 flex-1">
                                 <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-lg ring-4 ring-slate-900">
                                       {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" alt={friend.username} /> : friend.username[0].toUpperCase()}
                                    </div>
                                    {activeTab !== 'pending' && (
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-[4px] border-slate-900 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                    )}
                                 </div>
                                 <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                       <span className="font-bold text-white text-lg">{friend.username}</span>
                                       <span className="text-xs text-slate-500 font-medium opacity-0 group-hover:opacity-100 transition bg-slate-900 px-1.5 py-0.5 rounded">#{friend.discriminator}</span>
                                    </div>
                                    <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                       {req.status === 'PENDING' ? (isIncoming ? "Demande reçue" : "Demande envoyée") : (isOnline ? <span className="text-emerald-400">En ligne</span> : "Hors ligne")}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 {req.status === 'ACCEPTED' && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); startDM(friend.id); }} className="w-10 h-10 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-indigo-600 transition shadow-sm flex items-center justify-center" title="Message"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                                        <button onClick={(e) => { e.stopPropagation(); confirmDeleteFriend(req.id, friend.username); }} className="w-10 h-10 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-red-600 transition shadow-sm flex items-center justify-center" title="Retirer"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </>
                                 )}
                                 {isIncoming && (
                                    <>
                                      <button onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }} className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-500 hover:text-white hover:bg-emerald-600 transition shadow-sm flex items-center justify-center" title="Accepter"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-10 h-10 rounded-xl bg-slate-900 text-red-500 hover:text-white hover:bg-red-600 transition shadow-sm flex items-center justify-center" title="Refuser"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </>
                                 )}
                                 {(req.status === 'PENDING' && !isIncoming) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-10 h-10 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-red-600 transition shadow-sm flex items-center justify-center" title="Annuler"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                 )}
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            )}
         </div>

         {/* SIDEBAR DROITE REVISITÉE */}
         <div className="w-96 bg-slate-900 border-l border-slate-800 hidden 2xl:flex flex-col p-8">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Activité récente</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 select-none">
               <div className="w-full p-8 rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-800 mb-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl mx-auto mb-4 flex items-center justify-center rotate-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Personne ne fait rien d'intéressant pour le moment.</p>
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