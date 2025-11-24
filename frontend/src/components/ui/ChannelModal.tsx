import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Channel } from '../../store/serverStore';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string; 
  onSuccess?: () => void;
  channel?: Channel | null;
}

export default function ChannelModal({ isOpen, onClose, categoryId, onSuccess, channel }: Props) {
  const isEditMode = !!channel;
  
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(channel ? channel.name : '');
    }
  }, [isOpen, channel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (isEditMode && channel) {
        await api.put(`/channels/${channel.id}`, { name });
      } else if (categoryId) {
        await api.post('/channels', { name, categoryId, type: 'text' });
        if (onSuccess) onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Erreur sauvegarde salon", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!channel) return;
    setIsLoading(true);
    try {
      await api.delete(`/channels/${channel.id}`);
      onClose();
    } catch (error) {
      console.error("Erreur suppression salon", error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div 
            className="flex flex-col h-full bg-background-floating rounded-md overflow-hidden font-sans"
            onContextMenu={(e) => e.stopPropagation()}
        >
            <div className="px-6 pt-6 pb-2 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-text-header mb-1">
                        {isEditMode ? "Modifier le salon" : "Créer un salon"}
                    </h2>
                    <p className="text-text-muted text-xs">
                        {isEditMode ? "Changez le nom de votre salon." : "dans la catégorie SÉLECTIONNÉE"}
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-text-muted hover:text-text-header transition p-1 rounded-sm hover:bg-background-modifier-hover"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <div className="p-6">
                <form id="channel-form" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wide ml-1">
                            Nom du salon
                        </label>
                        
                        <div className="relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-text-muted pointer-events-none text-lg font-medium transition-colors group-focus-within:text-text-normal">
                                #
                            </div>

                            <input 
                                autoFocus={!isEditMode}
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full bg-background-tertiary border border-background-secondary text-text-normal text-sm p-3 pl-10 rounded-sm focus:border-brand outline-none font-medium transition-all placeholder-text-muted shadow-inner"
                                placeholder="nouveau-salon"
                                maxLength={32}
                                autoComplete="off"
                            />
                        </div>
                        
                        <p className="text-[11px] text-text-muted ml-1">
                            Uniquement des lettres minuscules, chiffres et tirets.
                        </p>
                    </div>
                </form>
            </div>

            <div className="px-6 py-4 bg-background-secondary flex justify-between items-center mt-auto border-t border-background-tertiary">
                <div className="flex-1">
                    {isEditMode && (
                        <button 
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-status-danger hover:underline text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            Supprimer
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-text-normal hover:underline text-sm font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        form="channel-form"
                        disabled={isLoading || !name.trim()}
                        className="px-6 py-2 bg-brand hover:bg-brand-hover text-white rounded-sm text-sm font-bold transition-all shadow-md active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {isLoading ? '...' : (isEditMode ? 'Enregistrer' : 'Créer le salon')}
                    </button>
                </div>
            </div>
        </div>
      </Modal>

      {isEditMode && channel && (
        <ConfirmModal 
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title={`Supprimer #${channel.name}`}
          message={
            <div className="space-y-2">
                <p>Êtes-vous sûr de vouloir supprimer le salon <strong className="text-text-header">#{channel.name}</strong> ?</p>
                <p className="text-xs text-status-danger bg-status-danger/10 p-2 rounded border border-status-danger/20 font-medium">
                    ⚠️ Cette action est irréversible. Tous les messages seront perdus.
                </p>
            </div>
          }
          isDestructive={true}
          confirmText="Oui, supprimer le salon"
        />
      )}
    </>
  );
}