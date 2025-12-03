import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Bot, Check, ChevronDown, ShieldAlert, X } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
}

interface BotInfo {
  id: string;
  username: string;
  avatarUrl: string | null;
}

const PERMISSIONS_MAP: Record<string, string> = {
  'ADMINISTRATOR': 'Administrateur',
  'MANAGE_SERVER': 'Gérer le serveur',
  'MANAGE_ROLES': 'Gérer les rôles',
  'MANAGE_CHANNELS': 'Gérer les salons',
  'KICK_MEMBERS': 'Expulser des membres',
  'BAN_MEMBERS': 'Bannir des membres',
  'SEND_MESSAGES': 'Envoyer des messages',
  'MANAGE_MESSAGES': 'Gérer les messages',
  'VIEW_CHANNELS': 'Voir les salons',
};

export default function OAuth2Authorize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const clientId = searchParams.get('client_id');
  const permissionsStr = searchParams.get('permissions') || '';
  const permissions = permissionsStr.split(',').filter(Boolean);

  const [bot, setBot] = useState<BotInfo | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !user) return;
    fetchData();
  }, [clientId, user]);

  const fetchData = async () => {
    try {
      // Fetch Bot Info (Public)
      const botRes = await api.get(`/bots/${clientId}/preview`);
      setBot(botRes.data);

      // Fetch User's Servers where they have MANAGE_SERVER permission
      const serversRes = await api.get('/users/me/servers');
      // Filter logic would go here if we had permissions in the response
      // For V1, let's show all servers where user is owner (we can check ownerId if available)
      // Or just show all and let backend reject if no perm.
      setServers(serversRes.data);
      
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Impossible de charger les informations. Vérifiez l'ID du client.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedServer) return;
    setAuthorizing(true);
    setError(null);

    try {
      await api.post(`/bots/${clientId}/invite`, {
        serverId: selectedServer,
        permissions
      });
      alert(`Bot ajouté avec succès au serveur !`);
      navigate(`/channels/${selectedServer}`);
    } catch (err: any) {
      console.error("Failed to authorize", err);
      setError(err.response?.data?.error || "Une erreur est survenue lors de l'autorisation.");
    } finally {
      setAuthorizing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#313338] flex items-center justify-center text-white">Chargement...</div>;
  if (!bot) return <div className="min-h-screen bg-[#313338] flex items-center justify-center text-white">Bot introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4 bg-[url('https://velmu.com/bg-pattern.png')] overflow-y-auto">
      <div className="bg-[#2B2D31] w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-fade-in my-8">
        <div className="p-8 text-center border-b border-[#1E1F22]">
           <div className="w-24 h-24 rounded-full bg-[#5865F2] mx-auto mb-4 flex items-center justify-center overflow-hidden ring-4 ring-[#1E1F22]">
             {bot.avatarUrl ? (
               <img src={bot.avatarUrl} alt={bot.username} className="w-full h-full object-cover" />
             ) : (
               <Bot size={48} className="text-white" />
             )}
           </div>
           <h1 className="text-2xl font-bold text-white mb-1">{bot.username}</h1>
           <p className="text-gray-400 text-sm">veut rejoindre votre serveur</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded text-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-xs font-bold uppercase mb-2">Ajouter au serveur</label>
            <div className="relative">
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full bg-[#1E1F22] text-white p-3 rounded appearance-none border border-transparent focus:border-[#5865F2] outline-none cursor-pointer"
              >
                <option value="">Sélectionner un serveur...</option>
                {servers.map(server => (
                  <option key={server.id} value={server.id}>{server.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-bold uppercase mb-2">Permissions demandées</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {permissions.length > 0 ? permissions.map(perm => (
                <div key={perm} className="flex items-center gap-3 text-gray-300 text-sm">
                  <Check size={16} className="text-green-400" />
                  <span>{PERMISSIONS_MAP[perm] || perm}</span>
                </div>
              )) : (
                <div className="text-gray-500 italic text-sm">Aucune permission demandée.</div>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-[#1E1F22] flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 rounded hover:underline text-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={handleAuthorize}
              disabled={!selectedServer || authorizing}
              className={`flex-1 px-4 py-2 rounded text-white font-medium transition-colors ${
                !selectedServer || authorizing 
                  ? 'bg-[#5865F2]/50 cursor-not-allowed' 
                  : 'bg-[#5865F2] hover:bg-[#4752C4]'
              }`}
            >
              {authorizing ? 'Autorisation...' : 'Autoriser'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
