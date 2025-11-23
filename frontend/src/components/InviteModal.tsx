import { useEffect, useState } from 'react';
import { Server } from '../store/serverStore';
import api from '../lib/api';
import Modal from './ui/Modal';

interface Props {
  isOpen: boolean;
  server: Server | null;
  onClose: () => void;
}

export default function InviteModal({ isOpen, server, onClose }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Génération automatique à l'ouverture
  useEffect(() => {
    if (isOpen && server) {
      const generateInvite = async () => {
        setIsLoading(true);
        try {
          const res = await api.post('/invites/create', { serverId: server.id });
          setInviteCode(res.data.code);
        } catch (error) {
          console.error("Erreur génération invitation", error);
        } finally {
          setIsLoading(false);
        }
      };
      generateInvite();
    } else {
      setInviteCode('');
      setCopied(false);
    }
  }, [isOpen, server]);

  if (!server) return null;

  const fullLink = inviteCode ? `${window.location.origin}/invite/${inviteCode}` : '';

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {/* relative est important ici pour positionner la croix */}
      <div className="relative p-6 flex flex-col items-center text-center">
        
        {/* ❌ BOUTON FERMER (Croix épurée) */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
            title="Fermer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* 1. ICÔNE EN-TÊTE */}
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 text-indigo-400 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        </div>

        {/* 2. TITRE & INFO */}
        <h2 className="text-xl font-bold text-white mb-2">
          Inviter des amis
        </h2>
        <p className="text-slate-400 text-sm mb-6 px-4">
          Partagez ce lien avec vos amis pour qu'ils rejoignent <span className="font-bold text-slate-200">{server.name}</span> instantanément.
        </p>

        {/* 3. ZONE DE LIEN (INPUT + BOUTON) */}
        <div className="w-full bg-[#111214] p-1.5 rounded-[4px] border border-slate-700/50 flex items-center relative overflow-hidden shadow-inner group transition-colors focus-within:border-indigo-500/50">
           
           {/* Skeleton Loader "Alive" */}
           {isLoading ? (
             <div className="flex-1 h-10 mx-2 flex items-center">
                <div className="h-4 bg-slate-700 rounded w-2/3 animate-pulse"></div>
             </div>
           ) : (
             <input 
               readOnly 
               value={fullLink}
               className="bg-transparent text-slate-300 font-medium text-sm outline-none w-full px-3 py-2 truncate selection:bg-indigo-500/30 cursor-text"
               onFocus={(e) => e.target.select()} 
             />
           )}
           
           <button 
             onClick={handleCopy} 
             disabled={isLoading}
             className={`
                flex-shrink-0 px-5 py-2 rounded-[3px] text-sm font-bold text-white transition-all duration-200 shadow-md
                ${copied 
                    ? 'bg-green-600 hover:bg-green-700 w-[100px]' 
                    : 'bg-indigo-600 hover:bg-indigo-700 w-[100px]'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
             `}
           >
             {copied ? 'Copié !' : 'Copier'}
           </button>
        </div>

        {/* 4. FOOTER DISCRET */}
        <div className="mt-6 text-[11px] text-slate-500">
            <p>Votre lien d'invitation n'expire jamais.</p>
        </div>

      </div>
    </Modal>
  );
}