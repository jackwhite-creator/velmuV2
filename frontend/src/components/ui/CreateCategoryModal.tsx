import { useState } from 'react';
import api from '../../lib/api';
import { useServerStore } from '../../store/serverStore';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
}

export default function CreateCategoryModal({ isOpen, onClose, serverId }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveServer } = useServerStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await api.post('/categories', { name, serverId });
      
      // Rafraîchissement
      const res = await api.get(`/servers/${serverId}`);
      setActiveServer(res.data);
      
      handleClose();
    } catch (error) {
      console.error("Erreur création catégorie", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        {/* 🛑 STOP PROPAGATION : Empêche le menu contextuel global */}
        <div 
            className="flex flex-col h-full bg-[#1E293B] overflow-hidden border border-slate-700/50"
            onContextMenu={(e) => e.stopPropagation()}
        >
            
            {/* 1. HEADER */}
            <div className="px-6 pt-6 pb-1 flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-bold text-white mb-1 tracking-tight">
                        Créer une catégorie
                    </h2>
                    <p className="text-slate-400 text-xs font-medium">
                        Organisez vos salons par thématiques.
                    </p>
                </div>
                <button 
                    onClick={handleClose} 
                    className="text-slate-400 hover:text-white transition p-1.5 rounded-md hover:bg-white/5 -mt-1 -mr-2"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            {/* 2. BODY */}
            <div className="p-6">
                <form id="cat-form" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider ml-1">
                            Nom de la catégorie
                        </label>
                        
                        {/* INPUT STYLISÉ (Même DA que ChannelModal) */}
                        <div className="relative group">
                            <input 
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value.toUpperCase())}
                                className="w-full bg-[#111214] border border-[#111214] text-white text-sm p-3 rounded-[4px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold tracking-wide placeholder-slate-700 transition-all shadow-inner"
                                placeholder="NOUVELLE CATEGORIE"
                                maxLength={32}
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* 3. FOOTER */}
            <div className="px-6 py-4 bg-[#18202F] flex justify-between items-center border-t border-slate-700/30 mt-auto">
                 <button 
                    type="button" 
                    onClick={handleClose} 
                    className="px-4 py-2 text-slate-400 hover:text-white hover:underline text-xs font-bold uppercase tracking-wide transition-colors"
                 >
                    Annuler
                 </button>
                 
                 <button 
                    type="submit" 
                    form="cat-form" 
                    disabled={!name.trim() || isLoading} 
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[4px] text-sm font-bold transition-all shadow-lg shadow-indigo-900/20 active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                 >
                   {isLoading ? '...' : 'Créer la catégorie'}
                 </button>
            </div>
        </div>
    </Modal>
  );
}