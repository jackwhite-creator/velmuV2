import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../lib/api';
import { Channel } from '../../../store/serverStore';
import ConfirmModal from '../../ui/ConfirmModal';
import Modal from '../../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string; 
  onSuccess?: () => void;
  channel?: Channel | null;
}

export default function ChannelModal({ isOpen, onClose, categoryId, onSuccess, channel }: Props) {
  const isEditMode = !!channel;
  const { serverId } = useParams();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'AUDIO'>('TEXT');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(channel ? channel.name : '');
      setType(channel ? (channel.type as 'TEXT' | 'AUDIO') : 'TEXT');
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
        if (!serverId) return;
        await api.post('/channels', { name, categoryId, type, serverId });
        if (onSuccess) onSuccess();
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!channel) return;
    setIsLoading(true);
    try {
      await api.delete(`/channels/${channel.id}`);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val.toLowerCase().replace(/\s+/g, '-'));
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

            <div className="px-6 py-4">
                <form id="channel-form" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {!isEditMode && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wide ml-1">
                                    Type de salon
                                </label>
                                <div className="space-y-2">
                                    <label className={`flex items-center p-3 rounded cursor-pointer transition-colors border ${type === 'TEXT' ? 'bg-background-modifier-selected border-brand' : 'bg-background-secondary border-transparent hover:bg-background-modifier-hover'}`}>
                                        <input 
                                            type="radio" 
                                            name="channelType" 
                                            value="TEXT" 
                                            checked={type === 'TEXT'} 
                                            onChange={() => setType('TEXT')}
                                            className="mr-3 accent-brand w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 font-medium text-text-normal">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                                                Textuel
                                            </div>
                                            <p className="text-xs text-text-muted mt-0.5 ml-7">Envoyez des messages, images, GIFs, émojis...</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-3 rounded cursor-pointer transition-colors border ${type === 'AUDIO' ? 'bg-background-modifier-selected border-brand' : 'bg-background-secondary border-transparent hover:bg-background-modifier-hover'}`}>
                                        <input 
                                            type="radio" 
                                            name="channelType" 
                                            value="AUDIO" 
                                            checked={type === 'AUDIO'} 
                                            onChange={() => setType('AUDIO')}
                                            className="mr-3 accent-brand w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 font-medium text-text-normal">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                                Vocal
                                            </div>
                                            <p className="text-xs text-text-muted mt-0.5 ml-7">Discutez en vocal, vidéo, partage d'écran...</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wide ml-1">
                                Nom du salon
                            </label>
                            
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-text-muted pointer-events-none text-lg font-medium transition-colors group-focus-within:text-text-normal">
                                    {type === 'AUDIO' ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                    ) : (
                                        '#'
                                    )}
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
                        </div>
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
                    ⚠️ Cette action est irréversible.
                </p>
            </div>
          }
          isDestructive={true}
          confirmText="Oui, supprimer"
        />
      )}
    </>
  );
}