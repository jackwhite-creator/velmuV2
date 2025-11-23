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

  return (
    <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
      
      <div className="h-12 border-b border-slate-800 flex items-center px-6 shadow-sm flex-shrink-0 bg-slate-900 z-10">
        <div className="flex items-center gap-3 mr-6 pr-6 border-r border-slate-800 text-slate-200 font-bold">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           Amis
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
           <button onClick={() => setActiveTab('online')} className={`px-3 py-1 rounded transition ${activeTab === 'online' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}>En ligne</button>
           <button onClick={() => setActiveTab('all')} className={`px-3 py-1 rounded transition ${activeTab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}>Tous</button>
           <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 rounded transition ${activeTab === 'pending' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}>En attente {pending.length > 0 && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pending.length}</span>}</button>
           <button onClick={() => setActiveTab('add')} className={`px-3 py-1 rounded transition ${activeTab === 'add' ? 'text-indigo-400 bg-indigo-500/10' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Ajouter</button>
        </div>
      </div>

      <div className="flex-1 flex">
         <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'add' ? (
               <div className="max-w-xl">
                  <h2 className="text-white font-bold text-xl mb-2">Ajouter un ami</h2>
                  <p className="text-slate-400 text-sm mb-6">Tu peux ajouter des amis grâce à leur pseudo Velmu (ex: Pseudo#0000).</p>
                  
                  <form onSubmit={handleAddFriend} className="relative group">
                     <div className={`absolute inset-0 rounded-lg opacity-20 transition ${addStatus?.type === 'success' ? 'bg-green-500' : addStatus?.type === 'error' ? 'bg-red-500' : 'bg-indigo-500 group-focus-within:opacity-40'}`}></div>
                     <input 
                        value={addUsername}
                        onChange={e => setAddUsername(e.target.value)}
                        placeholder="Pseudo#0000"
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-lg text-white focus:outline-none focus:border-indigo-500/50 transition relative z-10 placeholder-slate-600"
                     />
                     <button type="submit" disabled={!addUsername} className="absolute right-3 top-3 z-20 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-900/20">
                        Envoyer
                     </button>
                  </form>
                  {addStatus && <p className={`text-sm mt-3 font-medium ${addStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{addStatus.msg}</p>}
               </div>
            ) : (
               <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-4 pb-2 border-b border-slate-800 tracking-wider">
                     {activeTab === 'online' ? `En ligne — ${displayedList().length}` : 
                      activeTab === 'all' ? `Tous les amis — ${displayedList().length}` : 
                      `En attente — ${displayedList().length}`}
                  </div>

                  {displayedList().length === 0 ? (
                     <div className="flex flex-col items-center justify-center mt-20 opacity-40">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
                        </div>
                        <p className="text-slate-400 text-sm">Aucun ami à afficher pour le moment.</p>
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
                              className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-800 transition cursor-pointer" 
                              onClick={() => setViewProfileId(friend.id)}
                              onContextMenu={(e) => onUserContextMenu(e, friend)}
                           >
                              <div className="flex items-center gap-3 flex-1">
                                 <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                                       {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : friend.username[0].toUpperCase()}
                                    </div>
                                    {activeTab !== 'pending' && (
                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-slate-900 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                    )}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-1.5">
                                       <span className="font-bold text-slate-200 hover:underline">{friend.username}</span>
                                       <span className="text-xs text-slate-500 font-medium opacity-0 group-hover:opacity-100 transition">#{friend.discriminator}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                       {req.status === 'PENDING' ? (isIncoming ? "Demande reçue" : "Demande envoyée") : (isOnline ? "En ligne" : "Hors ligne")}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                 {req.status === 'ACCEPTED' && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); startDM(friend.id); }} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition shadow-sm" title="Message"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                                        <button onClick={(e) => { e.stopPropagation(); confirmDeleteFriend(req.id, friend.username); }} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 hover:border-red-500 transition shadow-sm" title="Retirer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </>
                                 )}
                                 {isIncoming && (
                                    <>
                                      <button onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-500 hover:text-white hover:bg-green-600 hover:border-green-500 transition shadow-sm" title="Accepter"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-600 hover:border-red-500 transition shadow-sm" title="Refuser"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    </>
                                 )}
                                 {(req.status === 'PENDING' && !isIncoming) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDecline(req.id); }} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-600 hover:border-red-500 transition shadow-sm" title="Annuler"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                 )}
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            )}
         </div>

         <div className="w-80 bg-slate-800 border-l border-slate-700 hidden xl:flex flex-col p-6">
            <h3 className="text-lg font-bold text-white mb-4">En ligne maintenant</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
               <div className="w-full p-6 rounded-lg border-2 border-dashed border-slate-700 mb-4">
                  <p className="text-sm text-slate-400">C'est très calme par ici...</p>
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