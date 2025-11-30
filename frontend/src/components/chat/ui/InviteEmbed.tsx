import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { useServerStore } from '../../../store/serverStore';

interface InviteInfo {
  code: string;
  server: {
    id: string;
    name: string;
    iconUrl: string | null;
  };
  approximatePresenceCount: number;
  approximateMemberCount: number;
}

export default function InviteEmbed({ code }: { code: string }) {
  const navigate = useNavigate();
  const { setServers, servers } = useServerStore();
  
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joining, setJoining] = useState(false);

  const isMember = info ? servers.some(s => s.id === info.server.id) : false;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    api.get(`/invites/${code}`)
      .then(res => {
        if (isMounted) {
            setInfo(res.data);
            setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
            setError(true);
            setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [code]);

  const handleJoin = async () => {
    if (isMember) {
        navigate(`/channels/${info?.server.id}`);
        return;
    }

    setJoining(true);
    try {
      const res = await api.post(`/invites/${code}/join`);
      const serversRes = await api.get('/servers');
      setServers(serversRes.data);
      navigate(`/channels/${res.data.serverId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return null;
  if (error || !info) return null;

  return (
    <div className="mt-2 flex flex-col items-start max-w-[432px]">
      <h3 className="text-[10px] font-bold text-zinc-400 uppercase mb-2 tracking-wide">
        Tu as été invité à rejoindre un serveur
      </h3>
      
      <div className="flex items-center gap-4 bg-secondary p-4 rounded-[4px] border border-tertiary w-full">
        
        <div className="flex-shrink-0">
            {info.server.iconUrl ? (
                <img src={info.server.iconUrl} alt={info.server.name} className="w-[50px] h-[50px] rounded-[16px] object-cover" />
            ) : (
                <div className="w-[50px] h-[50px] rounded-[16px] bg-zinc-700 flex items-center justify-center text-zinc-300 font-medium text-lg">
                    {info.server.name.substring(0, 2).toUpperCase()}
                </div>
            )}
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
            <div className="font-bold text-zinc-200 text-base truncate" title={info.server.name}>
                {info.server.name}
            </div>
            <div className="flex items-center gap-3 text-xs mt-1">
                {/* On affiche les compteurs même si c'est 0 pour garder la structure */}
                <div className="flex items-center gap-1.5" title="Membres en ligne (simulé)">
                    <div className="w-2 h-2 rounded-full bg-status-green"></div>
                    <span className="text-zinc-400">{info.approximatePresenceCount} en ligne</span>
                </div>
                <div className="flex items-center gap-1.5" title="Membres total">
                    <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                    <span className="text-zinc-400">{info.approximateMemberCount} membres</span>
                </div>
            </div>
        </div>

        <button 
            onClick={handleJoin}
            disabled={joining}
            className={`
                flex-shrink-0 px-4 py-2 rounded-[3px] text-sm font-medium text-white transition-colors
                ${isMember 
                    ? 'bg-zinc-600 hover:bg-zinc-500' 
                    : 'bg-status-green hover:bg-green-600'
                }
                ${joining ? 'opacity-50 cursor-wait' : ''}
            `}
        >
            {joining ? '...' : isMember ? 'Rejoint' : 'Rejoindre'}
        </button>

      </div>
    </div>
  );
}