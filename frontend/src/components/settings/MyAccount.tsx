import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyAccount() {
  const { user, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '', 
    bannerUrl: user?.bannerUrl || ''
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!user) return;
    const isChanged = formData.bio !== (user.bio || '') || 
                      formData.avatarUrl !== (user.avatarUrl || '') || 
                      formData.bannerUrl !== (user.bannerUrl || '');
    setHasChanges(isChanged);
  }, [formData, user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await api.put('/users/me', formData);
      const currentToken = localStorage.getItem('token');
      if (currentToken) login(currentToken, res.data);
      setHasChanges(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (!user) return;
    setFormData({
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      bannerUrl: user.bannerUrl || ''
    });
  };

  if (!user) return null;

  return (
    <div className="relative w-full h-full flex flex-col bg-background-primary">
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-24">
        <h1 className="text-xl font-bold text-text-header mb-6">Ton compte</h1>

        <div className="bg-background-primary rounded-lg overflow-hidden border border-background-tertiary relative mb-8">
          <div className="h-24 bg-background-tertiary relative">
              {formData.bannerUrl && <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="Bannière"/>}
          </div>
          
          <div className="px-5 pb-4 relative">
            
            <div className="absolute -top-10 left-5 group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-background-primary p-[5px]">
                  <div className="w-full h-full rounded-full bg-background-secondary flex items-center justify-center text-3xl font-bold text-text-header overflow-hidden relative">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.username[0].toUpperCase()
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-white uppercase tracking-wider pointer-events-none">
                        Modifier
                      </div>
                  </div>
                </div>
                <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-status-green border-[4px] border-background-primary rounded-full"></div>
            </div>

            <div className="pt-3 pl-24">
                <h2 className="text-xl font-bold text-text-header leading-tight mb-0.5">
                    {user.username}
                </h2>
                <span className="text-text-muted text-sm font-medium">#{user.discriminator}</span>
            </div>

          </div>

          <div className="bg-background-secondary p-4 m-4 rounded-md space-y-5 border border-background-tertiary mt-2">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-wide">Ta bio</label>
                <textarea
                  className="w-full bg-background-tertiary border-none rounded-sm p-2.5 text-text-normal text-sm focus:ring-1 focus:ring-brand outline-none h-20 resize-none transition-all placeholder-text-muted/50"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  maxLength={190}
                  placeholder="Dis-nous en plus sur toi..."
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-wide">Lien Avatar</label>
                    <input type="text" className="w-full bg-background-tertiary border-none rounded-sm p-2.5 text-text-normal text-sm focus:ring-1 focus:ring-brand outline-none" value={formData.avatarUrl} onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-wide">Lien Bannière</label>
                    <input type="text" className="w-full bg-background-tertiary border-none rounded-sm p-2.5 text-text-normal text-sm focus:ring-1 focus:ring-brand outline-none" value={formData.bannerUrl} onChange={(e) => setFormData({...formData, bannerUrl: e.target.value})} placeholder="https://..." />
                  </div>
              </div>
          </div>
        </div>
        
        <div className="border-t border-background-tertiary pt-6">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-4 tracking-wide">Mot de passe et Authentification</h3>
            <button className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-sm text-sm font-medium transition">Changer de mot de passe</button>
        </div>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            className="absolute bottom-6 left-6 right-6 p-3 bg-black/90 rounded-md shadow-2xl flex items-center justify-between backdrop-blur-sm border border-background-modifier-selected z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
              <p className="text-sm text-text-header font-medium px-2 truncate mr-4">Attention, tu as des modifications non enregistrées !</p>
              <div className="flex gap-4 items-center flex-shrink-0">
                  <button onClick={handleReset} className="text-sm font-medium hover:underline text-text-header">Réinitialiser</button>
                  <button onClick={handleSave} disabled={isLoading} className="bg-status-green hover:brightness-110 text-white px-6 py-1.5 rounded-sm text-sm font-semibold transition disabled:opacity-50 shadow-sm">
                      {isLoading ? '...' : 'Enregistrer'}
                  </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}