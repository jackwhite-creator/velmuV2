import { useState, useEffect, useCallback } from 'react';
import { Server } from '../../../store/serverStore';
import api from '../../../lib/api';
import Modal from '../../ui/Modal';

interface Props {
  isOpen: boolean;
  server: Server | null;
  onClose: () => void;
}

const EXPIRE_OPTIONS = [
    { label: '30 minutes', value: 1800 },
    { label: '1 heure', value: 3600 },
    { label: '6 heures', value: 21600 },
    { label: '12 heures', value: 43200 },
    { label: '1 jour', value: 86400 },
    { label: '7 jours', value: 604800 },
    { label: 'Jamais', value: 0 },
];

const USES_OPTIONS = [
    { label: 'Illimité', value: 0 },
    { label: '1 utilisation', value: 1 },
    { label: '5 utilisations', value: 5 },
    { label: '10 utilisations', value: 10 },
    { label: '25 utilisations', value: 25 },
    { label: '50 utilisations', value: 50 },
    { label: '100 utilisations', value: 100 },
];

export default function InviteModal({ isOpen, server, onClose }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [expiresIn, setExpiresIn] = useState(604800);
  const [maxUses, setMaxUses] = useState(0);

  const generateInvite = useCallback(async () => {
    if (!server) return;
    setIsLoading(true);
    try {
      const res = await api.post('/invites/create', { 
          serverId: server.id,
          expiresIn,
          maxUses
      });
      setInviteCode(res.data.code);
    } catch (error) {
      console.error("Erreur génération invitation", error);
    } finally {
      setIsLoading(false);
    }
  }, [server, expiresIn, maxUses]);

  useEffect(() => {
    if (isOpen && server) {
      generateInvite();
    } else {
      setInviteCode('');
      setCopied(false);
      setExpiresIn(604800);
      setMaxUses(0);
    }
  }, [isOpen, server, generateInvite]);

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
      <div className="relative p-6 flex flex-col items-center bg-background-floating font-sans">
        
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-header p-1 rounded-sm hover:bg-background-modifier-hover transition-all"
            title="Fermer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* ✅ ICÔNE REVENUE : Cercle avec bonhomme + plus */}
        <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mb-4 text-brand mt-2 shadow-sm ring-1 ring-brand/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        </div>

        <h2 className="text-lg font-bold text-text-header mb-1 uppercase tracking-wide text-center">
          Inviter des amis
        </h2>
        {/* ✅ NOM DU SERVEUR : Sans le #, en gras */}
        <p className="text-text-muted text-xs mb-6 px-4 text-center">
          Partage ce lien pour qu'ils rejoignent <strong className="text-text-normal">{server.name}</strong>.
        </p>

        <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Expire après</label>
                <div className="relative">
                    <select 
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                        className="w-full appearance-none bg-background-tertiary border border-background-secondary text-text-normal text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand cursor-pointer font-medium"
                    >
                        {EXPIRE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nombre max.</label>
                <div className="relative">
                    <select 
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value))}
                        className="w-full appearance-none bg-background-tertiary border border-background-secondary text-text-normal text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand cursor-pointer font-medium"
                    >
                        {USES_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
            </div>
        </div>

        <div className="w-full bg-background-tertiary p-1.5 rounded-sm border border-background-secondary flex items-center relative overflow-hidden shadow-inner group transition-colors focus-within:border-brand">
           
           {isLoading ? (
             <div className="flex-1 h-9 mx-2 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-xs text-text-muted font-medium">Génération...</span>
             </div>
           ) : (
             <input 
               readOnly 
               value={fullLink}
               className="bg-transparent text-text-normal font-medium text-sm outline-none w-full px-3 py-2 truncate selection:bg-brand/30 cursor-text placeholder-text-muted"
               onFocus={(e) => e.target.select()} 
             />
           )}
           
           <button 
             onClick={handleCopy} 
             disabled={isLoading}
             className={`
                flex-shrink-0 px-6 py-2 rounded-[2px] text-sm font-bold text-white transition-all duration-200 shadow-sm
                ${copied 
                    ? 'bg-status-green w-[100px]' 
                    : 'bg-brand hover:bg-brand-hover w-[100px]'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
             `}
           >
             {copied ? 'Copié' : 'Copier'}
           </button>
        </div>

        <div className="mt-4 text-[10px] text-text-muted">
            <p>Le lien expirera dans <span className="text-text-normal font-bold">{EXPIRE_OPTIONS.find(o => o.value === expiresIn)?.label}</span>.</p>
        </div>

      </div>
    </Modal>
  );
}