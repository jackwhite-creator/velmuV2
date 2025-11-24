import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';

interface InviteInfo {
  code: string;
  server: {
    id: string;
    name: string;
    iconUrl: string | null;
    memberCount: number;
  };
  inviter: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  // ✅ AJOUT : On récupère setServers pour mettre à jour la liste globale
  const { setServers } = useServerStore();
  
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInfo = async () => {
      if (!code) return;
      try {
        const res = await api.get(`/invites/${code}`);
        setInfo(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Invitation invalide ou expirée.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setIsJoining(true);
    setError('');

    try {
      const res = await api.post(`/invites/${code}/join`);
      const serverId = res.data.serverId;

      // ✅ CORRECTION CRUCIALE : On recharge la liste des serveurs pour que la sidebar se mette à jour
      // Sinon le nouveau serveur n'apparaît pas sans refresh (F5)
      const serversRes = await api.get('/servers');
      setServers(serversRes.data);

      if (serverId) {
        navigate(`/channels/${serverId}`);
      } else {
        navigate('/channels/@me');
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Impossible de rejoindre ce serveur.");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background-quaternary items-center justify-center font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-background-secondary rounded-2xl"></div>
            <div className="h-6 w-48 bg-background-secondary rounded-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-quaternary items-center justify-center font-sans select-none p-4">
       
       <div className="w-full max-w-md bg-background-primary rounded-md shadow-xl border border-background-tertiary p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          
            <div className="w-24 h-24 bg-background-secondary rounded-2xl flex items-center justify-center overflow-hidden mx-auto mb-6 border border-background-tertiary shadow-sm">
                {info?.server.iconUrl ? (
                    <img src={info.server.iconUrl} alt={info.server.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-text-header font-bold text-3xl">
                        {info?.server.name.substring(0, 2).toUpperCase()}
                    </span>
                )}
            </div>

            <div>
                <p className="text-text-muted text-sm font-medium mb-2">
                    <strong className="text-text-normal">{info?.inviter.username}</strong> t'a invité à rejoindre
                </p>

                <h1 className="text-2xl font-bold text-text-header mb-4 truncate leading-tight">
                    {info?.server.name}
                </h1>

                <div className="flex justify-center gap-4 mb-8 bg-background-secondary py-2 px-4 rounded-sm inline-flex mx-auto border border-background-tertiary">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-green"></div>
                        <span className="text-xs text-text-muted font-bold uppercase tracking-wide">{info?.server.memberCount} Membres</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-sm mb-6 border border-status-danger/20 font-medium">
                    {error}
                    </div>
                )}

                {!error && (
                    <button 
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-sm transition-all shadow-md active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                    >
                        {isJoining ? 'Entrée en cours...' : "Accepter l'invitation"}
                    </button>
                )}
            </div>
       </div>
    </div>
  );
}