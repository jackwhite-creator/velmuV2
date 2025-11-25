import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyAccount() {
  const { user, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [bio, setBio] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [activePreviewTab, setActivePreviewTab] = useState('info');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
        setBio(user.bio || '');
        setPreviewAvatar(user.avatarUrl || null);
        setPreviewBanner(user.bannerUrl || null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const isBioChanged = bio !== (user.bio || '');
    const isFileChanged = avatarFile !== null || bannerFile !== null;
    setHasChanges(isBioChanged || isFileChanged);
  }, [bio, avatarFile, bannerFile, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      if (type === 'avatar') {
          setAvatarFile(file);
          setPreviewAvatar(url);
      } else {
          setBannerFile(file);
          setPreviewBanner(url);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const res = await api.put('/users/me', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      const currentToken = localStorage.getItem('token');
      if (currentToken) login(currentToken, res.data);
      
      setAvatarFile(null);
      setBannerFile(null);
      setHasChanges(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (!user) return;
    setBio(user.bio || '');
    setPreviewAvatar(user.avatarUrl || null);
    setPreviewBanner(user.bannerUrl || null);
    setAvatarFile(null);
    setBannerFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  if (!user) return null;

  return (
    <div className="relative w-full h-full flex flex-col bg-background-primary overflow-hidden">
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-24">
        <h1 className="text-lg font-bold text-text-header mb-6">Aperçu du profil</h1>

        <div className="w-full max-w-md rounded-[8px] overflow-hidden shadow-lg bg-[#18191c] transition-all hover:shadow-xl">
            
            <div 
                className="h-24 bg-background-tertiary relative group cursor-pointer"
                onClick={() => bannerInputRef.current?.click()}
            >
                {previewBanner ? (
                    <img src={previewBanner} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" alt="Bannière"/>
                ) : (
                    <div className="w-full h-full bg-brand/20"></div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded-sm backdrop-blur-sm">CHANGER</span>
                </div>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'banner')} />
            </div>

            <div className="px-6 relative">
                <div 
                    className="absolute -top-10 left-6 group cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                >
                    <div className="w-20 h-20 rounded-full bg-[#18191c] p-1">
                        <div className="w-full h-full rounded-full bg-background-secondary flex items-center justify-center text-3xl font-bold text-text-header overflow-hidden relative">
                            {previewAvatar ? (
                                <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.username[0].toUpperCase()
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-white uppercase tracking-wider pointer-events-none">
                                EDIT
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-status-green border-[4px] border-[#18191c] rounded-full"></div>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'avatar')} />
                </div>

                <div className="pt-12 pb-4">
                    <div className="flex items-baseline gap-1">
                        <h2 className="text-2xl font-bold text-white leading-tight">{user.username}</h2>
                        <span className="text-xl text-zinc-400 font-medium">#{user.discriminator}</span>
                    </div>
                </div>

                <div className="border-b border-zinc-700/40 flex gap-6">
                    <div className="pb-3 text-sm font-semibold text-white relative">
                        Info utilisateur
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>
                    </div>
                    <div className="pb-3 text-sm font-semibold text-zinc-400 cursor-default">
                        Serveurs en commun
                    </div>
                    <div className="pb-3 text-sm font-semibold text-zinc-400 cursor-default">
                        Amis en commun
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 min-h-[180px] flex flex-col">
                <div className="flex-1 flex flex-col">
                    <div className="mb-2">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wide">À propos de moi</h3>
                        <textarea
                            className="w-full bg-transparent text-zinc-300 text-sm leading-relaxed resize-none outline-none placeholder-zinc-500 focus:bg-[#202225] rounded p-1 -ml-1 transition-colors"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={190}
                            placeholder="Cet utilisateur n'a pas encore de biographie."
                            rows={3}
                        />
                    </div>
                    <div className="mt-auto">
                        <div className="w-full h-[1px] bg-zinc-800/60 my-3"></div>
                        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">
                            Membre depuis le <span className="text-zinc-400 normal-case ml-0.5">
                                {user.createdAt 
                                    ? new Date(user.createdAt).toLocaleDateString('fr-FR') 
                                    : "Date inconnue"}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-10 border-t border-background-tertiary pt-6 max-w-md">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-3 tracking-wide">Authentification</h3>
            <button className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-[3px] text-sm font-medium transition w-full">
                Changer de mot de passe
            </button>
        </div>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            className="absolute bottom-6 left-8 right-8 p-3 bg-[#111214] rounded-[4px] shadow-2xl flex items-center justify-between border border-zinc-900 z-50 max-w-2xl"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
              <p className="text-xs text-white font-medium px-2">Modifications non enregistrées</p>
              <div className="flex gap-3 items-center flex-shrink-0">
                  <button onClick={handleReset} className="text-xs font-medium hover:underline text-zinc-300 hover:text-white px-2">Réinitialiser</button>
                  <button onClick={handleSave} disabled={isLoading} className="bg-status-green hover:bg-emerald-600 text-white px-5 py-1.5 rounded-[3px] text-xs font-bold transition disabled:opacity-50 shadow-sm">
                      {isLoading ? '...' : 'Enregistrer'}
                  </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}