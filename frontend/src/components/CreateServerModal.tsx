import { useState } from 'react';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import Modal from './ui/Modal'; // 👈 On utilise notre composant maître
import { useNavigate } from 'react-router-dom'; // Pour la redirection

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
      // 1. Création (Backend renvoie le serveur complet)
      const res = await api.post('/servers', { name });
      const fullServer = res.data;

      // 2. Mise à jour du Store
      addServer(fullServer);
      setActiveServer(fullServer);
      setActiveConversation(null);

      // 3. Sélection du salon par défaut et redirection
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

  // Génère les initiales pour l'aperçu de l'icône
  const getInitials = () => {
    if (!name.trim()) return '...';
    return name.trim().substring(0, 2).toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {/* On utilise un form pour encapsuler tout le contenu et gérer le submit */}
      <form onSubmit={handleSubmit} className="relative">
        
        {/* BOUTON FERMER (Notre DA) */}
        <button 
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
            title="Fermer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="p-8 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Crée ton espace</h2>
            <p className="text-slate-400 text-sm max-w-sm">
                Ton serveur est l'endroit où tu te retrouves avec tes amis. Donne-lui un nom et une icône pour commencer.
            </p>

            {/* APERÇU DE L'ICÔNE DYNAMIQUE */}
            <div className="my-8 flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-indigo-900/40 border-2 border-indigo-400/50">
                    {getInitials()}
                </div>
                <span className="text-xs text-slate-500">Aperçu de l'icône</span>
            </div>

            {/* INPUT */}
            <div className="w-full text-left">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wide">
                    Nom du serveur
                </label>
                <input 
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#111214] border border-slate-700 text-slate-100 p-3 rounded-[4px] focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600 font-medium text-lg"
                    placeholder="Mon super serveur"
                />
                {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
            </div>
        </div>

        {/* FOOTER AVEC BOUTON */}
        <div className="bg-slate-900/50 p-4 flex justify-end border-t border-slate-700/50">
             <button 
               type="submit" 
               disabled={isLoading || !name.trim()}
               className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
             >
               {isLoading ? 'Création en cours...' : 'Créer mon serveur'}
             </button>
        </div>

      </form>
    </Modal>
  );
}