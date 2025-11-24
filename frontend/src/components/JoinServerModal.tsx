import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import Modal from './ui/Modal';

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

  const handleClose = () => {
    setCode('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanCode = code.split('/').pop() || '';

    if (!cleanCode) {
        setError("Veuillez entrer un code valide.");
        setLoading(false);
        return;
    }

    try {
      const res = await api.post(`/invites/${cleanCode}/join`);

      if (res.data && res.data.serverId) {
        const serversRes = await api.get('/servers');
        setServers(serversRes.data);
        navigate(`/channels/${res.data.serverId}`);
        handleClose();
      } else {
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
      <div className="relative p-6 flex flex-col items-center text-center bg-background-floating font-sans">
        
        {/* Bouton Fermer avec z-index élevé pour être sûr qu'il est cliquable */}
        <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-header p-1 rounded-sm hover:bg-background-modifier-hover transition-all z-50"
            title="Fermer"
            type="button"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4 text-brand mt-2 shadow-sm ring-1 ring-brand/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </div>

        <h2 className="text-2xl font-bold text-text-header mb-2">
          Rejoindre un serveur
        </h2>
        <p className="text-text-muted text-sm mb-8 px-2 leading-relaxed">
          Saisis le code d'invitation ci-dessous pour rejoindre une nouvelle communauté.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            
            <div className="text-left w-full">
                <label className="block text-xs font-bold text-text-muted uppercase mb-2 ml-1 tracking-wide">
                    Code d'invitation ou Lien
                </label>
                <div className="relative group">
                    <input 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="ex: hKy7aP"
                        className="w-full bg-background-tertiary border border-background-secondary text-text-header p-3 rounded-sm focus:outline-none focus:border-brand transition-colors placeholder-text-muted font-medium text-base"
                        autoFocus
                    />
                </div>
                
                {error ? (
                    <p className="text-status-danger text-xs font-medium mt-2 flex items-center gap-1 animate-in slide-in-from-left-1">
                        {error}
                    </p>
                ) : (
                    <div className="mt-2">
                        <p className="text-text-muted text-xs ml-1">
                            Les liens ressemblent à <span className="text-text-normal font-mono bg-background-secondary px-1.5 py-0.5 rounded-sm text-[11px]">hKy7aP</span>
                        </p>
                    </div>
                )}
            </div>

            <button 
                type="submit"
                disabled={loading || !code}
                className={`
                    w-full py-3 rounded-sm text-sm font-bold text-white transition-all duration-200 shadow-md
                    ${(loading || !code) 
                        ? 'bg-background-secondary text-text-muted cursor-not-allowed' 
                        : 'bg-brand hover:bg-brand-hover active:translate-y-[1px]'
                    }
                `}
            >
                {loading ? 'Connexion...' : 'Rejoindre le serveur'}
            </button>

        </form>

      </div>
    </Modal>
  );
}