import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useServerStore, Server } from '../../store/serverStore';
import Modal from './Modal'; // ✅ On utilise ton composant maître

interface Props {
  isOpen: boolean;
  server: Server;
  onClose: () => void;
}

export default function EditServerModal({ isOpen, server, onClose }: Props) {
  const { setServers, servers, setActiveServer } = useServerStore();
  
  const [name, setName] = useState(server.name);
  const [iconUrl, setIconUrl] = useState(server.iconUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setName(server.name);
      setIconUrl(server.iconUrl || '');
      setHasChanges(false);
    }
  }, [isOpen, server]);

  // Détection des changements pour activer le bouton
  useEffect(() => {
    const isDifferent = name !== server.name || (iconUrl !== (server.iconUrl || ''));
    setHasChanges(isDifferent);
  }, [name, iconUrl, server]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hasChanges) return;
    
    setIsLoading(true);

    try {
      const res = await api.put(`/servers/${server.id}`, { name, iconUrl });
      const updatedServer = res.data;

      // Mise à jour du store local pour reflet immédiat
      const updatedList = servers.map(s => s.id === server.id ? { ...s, ...updatedServer } : s);
      setServers(updatedList);
      setActiveServer({ ...server, ...updatedServer });
      
      onClose();
    } catch (error) {
      console.error("Erreur update serveur", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback pour l'image (Initiales)
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col h-full relative">
        
        {/* 1. HEADER & VISUAL */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-900 to-slate-900 flex justify-center items-end pb-6">
            {/* Bouton Fermer */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <h2 className="absolute top-6 left-6 text-xs font-bold text-white/60 uppercase tracking-widest">
                Paramètres du serveur
            </h2>

            {/* Preview de l'icône (Centrale et flottante) */}
            <div className="absolute -bottom-10 shadow-2xl rounded-[24px] p-2 bg-[#1E293B]">
                <div className="w-24 h-24 rounded-[20px] bg-[#111214] flex items-center justify-center overflow-hidden border-2 border-slate-700/50 relative group">
                    {iconUrl ? (
                        <img 
                            src={iconUrl} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt="Server Icon"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                        />
                    ) : (
                        <span className="text-2xl font-bold text-slate-500 group-hover:text-slate-300 transition-colors select-none">
                            {initials}
                        </span>
                    )}
                    
                    {/* Overlay "Modifier" au survol */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide">Aperçu</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. FORMULAIRE */}
        <div className="pt-16 px-8 pb-8 bg-[#1E293B]">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Nom du serveur */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">
                        Nom du serveur
                    </label>
                    <input 
                        className="w-full bg-[#111214] border border-slate-700 text-slate-100 rounded-[4px] p-3 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Mon super serveur"
                    />
                </div>

                {/* URL Icône */}
                <div className="space-y-2">
                    <label className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">
                        <span>URL de l'icône</span>
                        {iconUrl && <span className="text-green-500 text-[10px] normal-case font-normal">Image détectée</span>}
                    </label>
                    <div className="relative">
                        <input 
                            className="w-full bg-[#111214] border border-slate-700 text-slate-100 rounded-[4px] p-3 pr-10 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm text-slate-400 focus:text-slate-200"
                            value={iconUrl}
                            onChange={e => setIconUrl(e.target.value)}
                            placeholder="https://imgur.com/..."
                        />
                        {iconUrl && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 ml-1">
                        Nous recommandons une image carrée d'au moins 512x512px.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 mt-2 border-t border-slate-700/50">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-sm font-medium text-slate-400 hover:text-slate-200 hover:underline transition-colors px-2"
                    >
                        Annuler
                    </button>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading || !hasChanges} 
                        className={`
                            px-6 py-2.5 rounded-[4px] text-sm font-bold text-white transition-all duration-200 shadow-lg
                            ${(isLoading || !hasChanges)
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-70 shadow-none' 
                                : 'bg-green-600 hover:bg-green-500 shadow-green-900/20 active:translate-y-[1px]'
                            }
                        `}
                    >
                        {isLoading ? 'Sauvegarde...' : 'Enregistrer'}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </Modal>
  );
}