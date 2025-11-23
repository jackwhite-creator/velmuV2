import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import Modal from './ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '', 
    bannerUrl: user?.bannerUrl || ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        bannerUrl: user.bannerUrl || ''
      });
      setHasChanges(false);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;
    const isChanged = formData.bio !== (user.bio || '') || 
                      formData.avatarUrl !== (user.avatarUrl || '') || 
                      formData.bannerUrl !== (user.bannerUrl || '');
    setHasChanges(isChanged);
  }, [formData, user]);

  if (!user) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await api.put('/users/me', formData);
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        login(currentToken, res.data);
      }
      setHasChanges(false);
    } catch (error) {
      console.error("Erreur update profil", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      bannerUrl: user.bannerUrl || ''
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col md:flex-row min-h-[600px] max-h-[85vh] bg-slate-800 text-slate-100">
        
        {/* COLONNE GAUCHE */}
        <div className="w-full md:w-64 bg-slate-900 p-6 flex flex-col border-r border-slate-700/50">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Paramètres Utilisateur</h2>
            <nav className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded bg-slate-700/50 text-white font-semibold text-sm">
                Mon Compte
              </button>
            </nav>
          </div>
          <div className="pt-4 border-t border-slate-700/50">
            <button 
              onClick={() => { logout(); onClose(); }}
              className="w-full text-left px-3 py-2 rounded text-red-400 hover:bg-red-500/10 text-sm font-medium transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition z-20">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div className="overflow-y-auto custom-scrollbar p-8 pb-24">
            <h1 className="text-2xl font-bold text-white mb-8">Mon Compte</h1>

            {/* CARTE PROFIL */}
            <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 relative">
              <div className="h-28 bg-indigo-500">
                 {formData.bannerUrl && <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="Bannière"/>}
              </div>
              
              <div className="p-4 pt-0">
                <div className="flex items-end gap-4 -mt-12">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-900 p-1.5">
                      <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                         {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                            user.username[0].toUpperCase()
                         )}
                      </div>
                    </div>
                    <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                        CHANGER
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-white pb-2 flex items-center gap-1">
                    {user.username}<span className="text-slate-400 text-lg font-normal">#{user.discriminator}</span>
                  </h2>
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 m-4 rounded-md space-y-6 border border-slate-700/30">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Bio</label>
                    <textarea
                      className="w-full bg-slate-900/70 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none h-24 resize-none transition-colors"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      maxLength={190}
                      placeholder="Parle un peu de toi..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Avatar (URL)</label>
                    <input type="text" className="w-full bg-slate-900/70 border border-slate-700 rounded p-2 text-white text-sm" value={formData.avatarUrl} onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">Bannière (URL)</label>
                    <input type="text" className="w-full bg-slate-900/70 border border-slate-700 rounded p-2 text-white text-sm" value={formData.bannerUrl} onChange={(e) => setFormData({...formData, bannerUrl: e.target.value})} />
                  </div>
              </div>
            </div>
          </div>

          {/* 👇 BANDEAU ANIMÉ "WORK HARD" V2 👇 */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div 
                // CORRECTION POSITIONNEMENT
                className="absolute bottom-4 left-4 right-4 p-3 bg-[#111214] rounded-lg shadow-2xl flex items-center justify-between"
                
                // CORRECTION ANIMATION
                initial={{ y: "120%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "120%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, mass: 0.8 }}
              >
                  <p className="text-sm text-slate-300 font-medium">Attention, tu as des changements non sauvegardés !</p>
                  <div className="flex gap-3">
                      <button onClick={handleReset} className="text-sm font-medium hover:underline px-3 py-1">Réinitialiser</button>
                      <button onClick={handleSave} disabled={isLoading} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm font-semibold transition disabled:opacity-50">
                          {isLoading ? '...' : 'Sauvegarder'}
                      </button>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>
    </Modal>
  );
}