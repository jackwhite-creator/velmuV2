import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useServerStore } from '../../store/serverStore';
import { useSocketStore } from '../../store/socketStore';

interface InviteEmbedProps {
  code: string;
  onLoad?: () => void;
}

interface InviteData {
  code: string;
  server: {
    id: string;
    name: string;
    iconUrl?: string;
    _count?: {
      members: number;
    };
  };
  creator?: {
    username: string;
  };
  uses: number;
  maxUses: number;
  expiresAt: string | null;
  onlineCount?: number;
}

export default function InviteEmbed({ code, onLoad }: InviteEmbedProps) {
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { servers, setServers } = useServerStore();
  const { socket } = useSocketStore();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await api.get(`/invites/${code}`);
        setInvite(res.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [code]);

  useEffect(() => {
    if (invite && onLoad) {
        // Delay to ensure DOM is updated and height is calculated
        const timer = setTimeout(() => {
            onLoad();
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [invite]);

  const isMember = invite ? servers.some(s => s.id === invite.server.id) : false;

  const handleAction = async () => {
    if (!invite) return;

    if (isMember) {
        navigate(`/channels/${invite.server.id}`);
        return;
    }

    setJoining(true);
    try {
      const res = await api.post(`/invites/${code}/join`);
      
      // Refresh server list
      const serversRes = await api.get('/servers');
      setServers(serversRes.data);

      if (res.data && res.data.id) {
        if (socket) {
            socket.emit('join_server', res.data.id);
        }
        navigate(`/channels/${res.data.id}`);
      }
    } catch (err) {
      console.error("Failed to join server", err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return null; 
  if (error || !invite) return null; 

  return (
    <div className="mt-2 max-w-[432px] bg-background-secondary rounded-[4px] p-4 flex flex-col gap-3 border border-background-tertiary select-none">
      <div className="text-xs font-bold text-text-muted uppercase tracking-wide">
        Tu as été invité à rejoindre un serveur
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-[50px] h-[50px] rounded-[16px] bg-background-tertiary flex-shrink-0 overflow-hidden">
          {invite.server.iconUrl ? (
            <img src={invite.server.iconUrl} alt={invite.server.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-normal font-bold text-lg bg-background-tertiary">
              {invite.server.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-normal truncate text-base mb-0.5">
            {invite.server.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-status-green"></div>
              <span>{invite.onlineCount || 0} En ligne</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-text-muted"></div>
              <span>{invite.server._count?.members || 0} Membres</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleAction}
          disabled={joining}
          className={`
            px-4 py-2 rounded-[3px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${isMember 
                ? 'bg-background-tertiary hover:bg-background-modifier-hover text-text-normal' 
                : 'bg-status-green hover:bg-status-green/90 text-white'
            }
          `}
        >
          {joining ? '...' : (isMember ? 'Aller sur le serveur' : 'Rejoindre')}
        </button>
      </div>
    </div>
  );
}
