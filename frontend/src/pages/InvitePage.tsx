import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Check } from 'lucide-react';
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

      // Reload servers list to update sidebar
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
            <div className="w-24 h-24 bg-background-secondary rounded-2xl"></div>
            <div className="h-6 w-56 bg-background-secondary rounded"></div>
            <div className="h-4 w-32 bg-background-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-quaternary items-center justify-center font-sans p-4">
       
       <div className="w-full max-w-md bg-background-primary rounded-lg shadow-xl border border-background-tertiary p-8">
          
            {/* Server Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-background-secondary rounded-2xl flex items-center justify-center overflow-hidden border border-background-tertiary shadow-sm">
                  {info?.server.iconUrl ? (
                      <img src={info.server.iconUrl} alt={info.server.name} className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-text-header font-bold text-3xl">
                          {info?.server.name.substring(0, 2).toUpperCase()}
                      </span>
                  )}
              </div>
            </div>

            {/* Invitation Text */}
            <div className="text-center mb-6">
                <p className="text-text-muted text-sm font-medium mb-1">
                    <span className="text-text-normal font-semibold">{info?.inviter.username}</span> t'invite à rejoindre
                </p>

                <h1 className="text-3xl font-bold text-text-header mb-5 truncate">
                    {info?.server.name}
                </h1>

                {/* Member Count */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 bg-background-secondary py-2 px-4 rounded border border-background-tertiary">
                        <div className="w-2 h-2 rounded-full bg-status-green"></div>
                        <Users className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-normal font-semibold">
                          {info?.server.memberCount.toLocaleString()}
                        </span>
                        <span className="text-sm text-text-muted">
                          membre{(info?.server.memberCount || 0) > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded border border-status-danger/30 font-medium mb-4">
                      {error}
                    </div>
                )}

                {/* Join Button */}
                {!error && (
                    <button 
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 px-4 rounded transition-colors shadow-sm active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isJoining ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Connexion...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            Accepter l'invitation
                          </>
                        )}
                    </button>
                )}
            </div>
       </div>
    </div>
  );
}