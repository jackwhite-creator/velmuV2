import { useState, useEffect } from 'react';
import { Server } from '../../../store/serverStore';
import api from '../../../lib/api';
import ConfirmModal from '../../ui/ConfirmModal';

interface Invite {
  id: string;
  code: string;
  uses: number;
  maxUses: number;
  expiresAt: string | null;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
  };
}

interface Props {
  server: Server;
}

export default function ServerInvites({ server }: Props) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  
  const [inviteToDelete, setInviteToDelete] = useState<Invite | null>(null);

  useEffect(() => {
    fetchInvites();
  }, [server.id]);

  const fetchInvites = async () => {
    try {
      const res = await api.get(`/servers/${server.id}/invites`);
      setInvites(res.data);
    } catch (error) {
      console.error("Erreur chargement invitations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvite = async () => {
    if (!inviteToDelete) return;
    try {
        await api.delete(`/servers/${server.id}/invites/${inviteToDelete.id}`);
        setInvites(prev => prev.filter(i => i.id !== inviteToDelete.id));
    } catch (error) {
        console.error(error);
    } finally {
        setInviteToDelete(null);
    }
  };

  // ✅ CORRECTION : Logique précise pour le compte à rebours
  const formatExpiration = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime(); // Différence en millisecondes

    if (diff < 0) return "Expirée";

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Dans ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Dans ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Dans ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return "Moins d'une minute";
  };

  const handleCopy = (inviteId: string, code: string) => {
    navigator.clipboard.writeText(`https://velmu.app/invite/${code}`);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-primary h-full min-h-0 font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
        
        <div className="mb-8">
            <h1 className="text-xl font-bold text-text-header mb-2">Invitations</h1>
            <p className="text-sm text-text-muted">
                Voici la liste de tous les liens d'invitation actifs pour <strong>{server.name}</strong>.
                Tu peux révoquer n'importe quel lien ici.
            </p>
        </div>

        {isLoading ? (
            <div className="text-text-muted text-sm animate-pulse">Chargement des invitations...</div>
        ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-background-tertiary rounded-md bg-background-secondary/30">
                <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <p className="text-text-header font-medium">Aucune invitation active</p>
                <p className="text-text-muted text-xs mt-1">Créez-en une depuis le menu principal !</p>
            </div>
        ) : (
            <div className="space-y-1">
                
                <div className="flex items-center px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wide">
                    <div className="flex-1">Inviteur</div>
                    <div className="w-28">Code</div>
                    <div className="w-24 text-center">Utilisations</div>
                    <div className="w-28 text-right">Expiration</div>
                    <div className="w-10"></div>
                </div>

                {invites.map((invite) => {
                    const isCopied = copiedInviteId === invite.id;

                    return (
                    <div 
                        key={invite.id} 
                        className="group flex items-center px-4 py-3 bg-background-secondary rounded-sm border border-transparent hover:border-background-tertiary transition-colors select-none"
                    >
                        
                        {/* CRÉATEUR */}
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-background-tertiary flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {invite.creator.avatarUrl ? (
                                    <img src={invite.creator.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <span className="text-[10px] font-bold text-text-normal">{invite.creator.username[0].toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-text-header truncate">{invite.creator.username}</span>
                                    <span className="text-xs text-text-muted">#{invite.creator.discriminator}</span>
                                </div>
                            </div>
                        </div>

                        {/* CODE */}
                        <div className="w-28">
                            <div 
                                className={`flex items-center gap-2 cursor-pointer transition-colors ${isCopied ? 'text-status-green' : 'hover:text-text-header text-text-normal'}`} 
                                onClick={() => handleCopy(invite.id, invite.code)}
                            >
                                <span className="font-mono text-xs bg-background-tertiary px-1.5 py-0.5 rounded select-all">{invite.code}</span>
                                {isCopied ? (
                                    <span className="text-[10px] font-bold animate-in fade-in slide-in-from-left-1">Copié !</span>
                                ) : (
                                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                )}
                            </div>
                        </div>

                        {/* UTILISATIONS */}
                        <div className="w-24 text-center text-sm text-text-normal">
                            {invite.uses} <span className="text-text-muted">/ {invite.maxUses === 0 ? '∞' : invite.maxUses}</span>
                        </div>

                        {/* EXPIRATION */}
                        <div className="w-28 text-right text-xs font-medium text-text-muted">
                            {formatExpiration(invite.expiresAt)}
                        </div>

                        {/* SUPPRIMER */}
                        <div className="w-10 flex justify-end">
                            <button 
                                onClick={() => setInviteToDelete(invite)}
                                className="text-text-muted hover:text-status-danger p-1.5 rounded-sm hover:bg-background-tertiary transition-colors opacity-0 group-hover:opacity-100"
                                title="Révoquer l'invitation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                    </div>
                )})}
            </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!inviteToDelete}
        onClose={() => setInviteToDelete(null)}
        onConfirm={handleDeleteInvite}
        title="Révoquer l'invitation"
        message={
            <span>
                Es-tu sûr de vouloir supprimer cette invitation ? <br/>
                Le code <span className="font-mono text-text-header bg-background-tertiary px-1 rounded">{inviteToDelete?.code}</span> ne fonctionnera plus.
            </span>
        }
        isDestructive={true}
        confirmText="Révoquer"
      />
    </div>
  );
}