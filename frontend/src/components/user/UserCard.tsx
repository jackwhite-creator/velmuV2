import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServerStore } from '../../store/serverStore';
import api from '../../lib/api';

interface UserCardProps {
  userId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onEditProfile: () => void;
  onOpenFullProfile: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export default function UserCard({ userId, position, onClose, onEditProfile, onOpenFullProfile }: UserCardProps) {
  const { user: currentUser } = useAuthStore();
  
  // On récupère les actions du store pour changer de vue
  const { 
    onlineUsers, 
    setActiveServer, 
    setActiveConversation, 
    addConversation 
  } = useServerStore(); 
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMessageLoading, setIsMessageLoading] = useState(false); // État chargement bouton message
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Calcul du statut dynamique
  const isOnline = onlineUsers.has(userId);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Erreur profil");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => { document.addEventListener('click', handleClickOutside); }, 100);
    return () => { document.removeEventListener('click', handleClickOutside); };
  }, [onClose]);

  // --- ACTION : LANCER UN DM ---
  const handleSendMessage = async () => {
    setIsMessageLoading(true);
    try {
      // 1. Appel API pour créer ou récupérer la conv
      const res = await api.post('/conversations', { targetUserId: userId });
      const conversation = res.data;

      // 2. Mise à jour du store
      addConversation(conversation); // Ajoute à la liste si pas déjà là
      setActiveServer(null); // Quitte le mode serveur -> Mode Accueil
      setActiveConversation(conversation); // Ouvre le chat privé

      // 3. Fermer la carte
      onClose();
    } catch (error) {
      console.error("Impossible de lancer la conversation", error);
    } finally {
      setIsMessageLoading(false);
    }
  };

  const style = {
    top: Math.min(position.y, window.innerHeight - 400) + 'px',
    left: Math.min(position.x + 20, window.innerWidth - 340) + 'px',
  };

  const isMe = currentUser?.id === profile?.id;

  return (
    <div 
      ref={cardRef}
      style={style}
      className="fixed z-50 w-80 bg-[#111214] rounded-lg shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {loading ? (
        <div className="h-32 flex items-center justify-center text-slate-500 text-sm">Chargement...</div>
      ) : profile ? (
        <>
          {/* Bannière */}
          <div className="h-24 w-full bg-slate-700 relative">
             {profile.bannerUrl ? (
               <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="Bannière" />
             ) : (
               <div className="w-full h-full bg-indigo-600"></div>
             )}
             {isMe && (
               <button 
                 onClick={() => { onClose(); onEditProfile(); }}
                 className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                 title="Modifier le profil"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
               </button>
             )}
          </div>

          <div className="px-4 pb-4 relative">
            {/* Avatar + Status Dynamique */}
            <div 
              className="w-24 h-24 rounded-full bg-[#111214] p-1.5 -mt-12 mb-3 relative cursor-pointer group"
              onClick={() => { onClose(); onOpenFullProfile(); }}
            >
              <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden relative">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:brightness-110 transition" />
                ) : (
                  profile.username[0].toUpperCase()
                )}
              </div>
              
              {/* PASTILLE DYNAMIQUE */}
              <div 
                className={`absolute bottom-1 right-1 w-6 h-6 border-[4px] border-[#111214] rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} 
                title={isOnline ? "En ligne" : "Hors ligne"}
              ></div>
            </div>

            {/* Infos */}
            <div className="bg-[#2B2D31] rounded-lg p-3 border border-slate-700/30">
              <h3 
                className="text-lg font-bold text-white leading-none flex items-center gap-1 cursor-pointer hover:underline"
                onClick={() => { onClose(); onOpenFullProfile(); }}
              >
                {profile.username}
              </h3>
              <div className="text-xs text-slate-400 mb-3 font-mono mt-0.5">#{profile.discriminator}</div>
              <div className="h-[1px] bg-slate-700/50 w-full mb-3"></div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">À propos de moi</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {profile.bio || "Aucune bio."}
              </p>
            </div>
            
            {/* Footer Actions (Send Message) */}
            {!isMe && (
              <div className="mt-4">
                 <button 
                    onClick={handleSendMessage}
                    disabled={isMessageLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/50 rounded px-3 py-2 text-xs font-bold text-white transition shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-70"
                 >
                    {isMessageLoading ? (
                      <span>Chargement...</span>
                    ) : (
                      <>
                        Envoyer un message
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      </>
                    )}
                 </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-4 text-red-400 text-sm">Utilisateur introuvable</div>
      )}
    </div>
  );
}