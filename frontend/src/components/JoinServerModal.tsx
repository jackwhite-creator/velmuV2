import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import Modal from './ui/Modal'; // 👈 Notre composant maître

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinServerModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { setServers } = useServerStore();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset du state à la fermeture
  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Nettoyage du code (ex: lien complet -> code seul)
    const cleanCode = code.split('/').pop() || '';

    if (!cleanCode) {
        setError("Veuillez entrer un code valide.");
        setLoading(false);
        return;
    }

    try {
      const res = await api.post(`/invites/${cleanCode}/join`);

      if (res.data && res.data.serverId) {
        // Rechargement de la liste pour voir le nouveau serveur
        const serversRes = await api.get('/servers');
        setServers(serversRes.data);

        navigate(`/channels/${res.data.serverId}`);
        handleClose();
      } else {
        // Fallback si réponse inattendue mais succès (200 OK)
        const serversRes = await api.get('/servers');
        setServers(serversRes.data);
        handleClose();
      }

    } catch (err: any) {
      console.error("Erreur join:", err);
      if (err.response?.status === 404) {
          setError("Invitation introuvable ou code incorrect.");
      } else if (err.response?.status === 410) {
          setError("Cette invitation a expiré.");
      } else {
          setError("Impossible de rejoindre le serveur (Erreur serveur).");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="relative p-6 flex flex-col items-center text-center">
        
        {/* ❌ BOUTON FERMER */}
        <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
            title="Fermer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* 1. ICÔNE (Boussole pour "Explorer") */}
        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400 mt-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </div>

        {/* 2. TITRE & INFO */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Rejoindre un serveur
        </h2>
        <p className="text-slate-400 text-sm mb-6 px-2">
          Saisissez le code d'invitation ci-dessous pour rejoindre une nouvelle communauté.
        </p>

        {/* 3. FORMULAIRE */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            
            {/* Input Stylisé */}
            <div className="text-left w-full">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wide">
                    Code d'invitation ou Lien
                </label>
                <div className="relative group">
                    <input 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="ex: hKy7aP"
                        className="w-full bg-[#111214] border border-slate-700 text-slate-200 p-3 rounded-[4px] focus:outline-none focus:border-green-500 transition-colors placeholder-slate-600 font-medium"
                        autoFocus
                    />
                </div>
                
                {/* Gestion des erreurs / Aide */}
                {error ? (
                    <p className="text-red-400 text-xs font-medium mt-2 flex items-center gap-1 animate-in slide-in-from-left-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {error}
                    </p>
                ) : (
                    <div className="mt-2">
                        <p className="text-slate-500 text-xs">
                            Les liens ressemblent à <span className="text-slate-400 font-mono bg-slate-800 px-1 rounded">hKy7aP</span>
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                            ou <span className="text-slate-400 font-mono bg-slate-800 px-1 rounded">https://velmu.app/invite/...</span>
                        </p>
                    </div>
                )}
            </div>

            {/* BOUTON ACTION */}
            <button 
                type="submit"
                disabled={loading || !code}
                className={`
                    w-full py-3 rounded-[4px] text-sm font-bold text-white transition-all duration-200 shadow-lg mt-2
                    ${(loading || !code) 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-500 active:translate-y-[1px] shadow-green-900/20'
                    }
                `}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Connexion...
                    </span>
                ) : 'Rejoindre le serveur'}
            </button>

        </form>

      </div>
    </Modal>
  );
}