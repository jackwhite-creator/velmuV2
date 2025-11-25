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
  const [type, setType] = useState<'TEXT' | 'AUDIO' | 'VIDEO'>('TEXT');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(channel ? channel.name : '');
      // On conserve le type existant si on édite, sinon par défaut TEXT
      setType(channel ? (channel.type as any) : 'TEXT');
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
        await api.post('/channels', { name, categoryId, type });
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
    // Pour les salons textuels, on force le kebab-case
    // Pour vocal/vidéo, on peut être plus souple, mais gardons la cohérence pour l'instant
    setName(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const RadioOption = ({ 
    value, 
    label, 
    description, 
    icon 
  }: { 
    value: 'TEXT' | 'AUDIO' | 'VIDEO', 
    label: string, 
    description: string, 
    icon: React.ReactNode 
  }) => (
    <div 
        onClick={() => !isEditMode && setType(value)}
        className={`
            relative flex items-center p-3 rounded-md cursor-pointer border mb-2 transition-all
            ${type === value 
                ? 'bg-background-modifier-selected border-brand/50' 
                : 'bg-background-secondary border-transparent hover:bg-background-modifier-hover'}
            ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <div className="mr-4 text-text-muted">
            {icon}
        </div>
        <div className="flex-1">
            <div className={`font-bold text-sm ${type === value ? 'text-text-header' : 'text-text-normal'}`}>
                {label}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
                {description}
            </div>
        </div>
        <div className="ml-2">
            <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${type === value ? 'border-brand' : 'border-text-muted'}
            `}>
                {type === value && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
            </div>
        </div>
    </div>
  );

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

            <div className="px-6 py-4 overflow-y-auto custom-scrollbar max-h-[400px]">
                <form id="channel-form" onSubmit={handleSubmit}>
                    
                    {/* TYPE SELECTOR (Visible uniquement en création) */}
                    {!isEditMode && (
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-2">
                                Type de salon
                            </label>
                            
                            <RadioOption 
                                value="TEXT" 
                                label="Textuel" 
                                description="Envoyer des messages, images, avis." 
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>}
                            />
                            
                            <RadioOption 
                                value="AUDIO" 
                                label="Vocal" 
                                description="Discuter ensemble par la voix." 
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                            />

                            <RadioOption 
                                value="VIDEO" 
                                label="Vidéo" 
                                description="Se voir et partager son écran." 
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>}
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wide ml-1">
                            Nom du salon
                        </label>
                        
                        <div className="relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-text-muted pointer-events-none text-lg font-medium transition-colors group-focus-within:text-text-normal">
                                {type === 'TEXT' ? '#' : (type === 'AUDIO' ? '🔊' : '📹')}
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
          title={`Supprimer ${channel.name}`}
          message={
            <div className="space-y-2">
                <p>Êtes-vous sûr de vouloir supprimer le salon <strong className="text-text-header">{channel.name}</strong> ?</p>
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