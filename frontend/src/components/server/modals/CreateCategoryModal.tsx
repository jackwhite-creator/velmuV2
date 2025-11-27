import { useState } from 'react';
import api from '../../../lib/api';
import { useServerStore } from '../../../store/serverStore';
import Modal from '../../ui/Modal';

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
        <div 
            className="flex flex-col h-full bg-background-floating overflow-hidden border border-background-tertiary font-sans"
            onContextMenu={(e) => e.stopPropagation()}
        >
            
            {/* HEADER */}
            <div className="px-6 pt-6 pb-1 flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-bold text-text-header mb-1 tracking-tight">
                        Créer une catégorie
                    </h2>
                    <p className="text-text-muted text-xs font-medium">
                        Organise tes salons par thématiques.
                    </p>
                </div>
                <button 
                    onClick={handleClose} 
                    className="text-text-muted hover:text-text-header transition p-1.5 rounded-sm hover:bg-background-modifier-hover -mt-1 -mr-2"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            {/* BODY */}
            <div className="p-6">
                <form id="cat-form" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider ml-1">
                            Nom de la catégorie
                        </label>
                        
                        <div className="relative group">
                            <input 
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value.toUpperCase())}
                                className="w-full bg-background-tertiary border border-background-secondary text-text-normal text-sm p-3 rounded-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none font-bold tracking-wide placeholder-text-muted transition-all shadow-inner"
                                placeholder="NOUVELLE CATÉGORIE"
                                maxLength={32}
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 bg-background-secondary flex justify-between items-center border-t border-background-tertiary mt-auto">
                 <button 
                    type="button" 
                    onClick={handleClose} 
                    className="px-4 py-2 text-text-muted hover:text-text-normal hover:underline text-xs font-bold uppercase tracking-wide transition-colors"
                 >
                    Annuler
                 </button>
                 
                 <button 
                    type="submit" 
                    form="cat-form" 
                    disabled={!name.trim() || isLoading} 
                    className="px-6 py-2 bg-brand hover:bg-brand-hover text-white rounded-sm text-sm font-bold transition-all shadow-md active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                 >
                   {isLoading ? '...' : 'Créer la catégorie'}
                 </button>
            </div>
        </div>
    </Modal>
  );
}