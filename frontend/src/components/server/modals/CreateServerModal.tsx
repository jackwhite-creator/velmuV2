import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerStore } from '../../../store/serverStore';
import api from '../../../lib/api';
import Modal from '../../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateServerModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { addServer, setActiveServer, setActiveChannel, setActiveConversation } = useServerStore();

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/servers', { name });
      const fullServer = res.data;

      addServer(fullServer);
      setActiveServer(fullServer);
      setActiveConversation(null);

      const firstChannel = fullServer.categories?.[0]?.channels?.[0];
      if (firstChannel) {
          setActiveChannel(firstChannel);
          navigate(`/channels/${fullServer.id}/${firstChannel.id}`);
      } else {
          setActiveChannel(null);
          navigate(`/channels/${fullServer.id}`);
      }

      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (!name.trim()) return '...';
    return name.trim().substring(0, 2).toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit} className="relative font-sans text-text-normal">
        
        <button 
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-normal p-1 rounded-sm hover:bg-background-modifier-hover transition-all"
            title="Fermer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="p-8 flex flex-col items-center text-center bg-background-floating">
            <h2 className="text-2xl font-bold text-text-header mb-2">Crée ton espace</h2>
            <p className="text-text-muted text-sm max-w-sm text-center leading-relaxed">
                Ton serveur est l'endroit où tu te retrouves avec tes amis. Donne-lui un nom et une icône pour commencer.
            </p>

            <div className="my-8 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-md bg-brand flex items-center justify-center text-4xl font-bold text-text-header shadow-lg ring-4 ring-background-tertiary">
                    {getInitials()}
                </div>
                <span className="text-xs text-text-muted font-bold uppercase tracking-wide">Aperçu</span>
            </div>

            <div className="w-full text-left">
                <label className="block text-xs font-bold text-text-muted uppercase mb-2 ml-1 tracking-wide">
                    Nom du serveur
                </label>
                <input 
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background-tertiary border border-background-secondary text-text-header p-3 rounded-sm focus:outline-none focus:border-brand transition-colors placeholder-text-muted font-medium text-base"
                    placeholder="Mon super serveur"
                />
                {error && <p className="text-status-danger text-xs mt-2 font-medium ml-1">{error}</p>}
            </div>
        </div>

        <div className="bg-background-secondary p-4 flex justify-between items-center border-t border-background-tertiary">
             <button
                type="button"
                onClick={handleClose}
                className="text-sm font-medium text-text-normal hover:underline px-2"
             >
                Retour
             </button>
             <button 
               type="submit" 
               disabled={isLoading || !name.trim()}
               className="bg-brand hover:bg-brand-hover text-white px-8 py-2.5 rounded-sm text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? 'Création...' : 'Créer'}
             </button>
        </div>

      </form>
    </Modal>
  );
}