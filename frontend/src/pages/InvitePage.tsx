import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { addServer, setActiveServer, setActiveChannel, setActiveConversation } = useServerStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code) return;
    setIsLoading(true);
    setError('');

    try {
      // 1. Appel API pour rejoindre
      const res = await api.post(`/invites/${code}/join`);
      const server = res.data;

      // 2. Mise à jour du store (Comme dans JoinServerModal)
      addServer(server);
      setActiveServer(server);
      setActiveConversation(null);

      // 3. Persistance pour que ChatPage charge le bon serveur
      localStorage.setItem('lastServerId', server.id);
      localStorage.setItem('lastConversationId', 'null');
      
      // 4. Redirection vers l'interface de chat
      navigate('/channels/' + server.id);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Impossible de rejoindre ce serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 items-center justify-center bg-[url('https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png')] bg-no-repeat bg-center bg-[length:100px]">
       <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center border border-slate-700 relative overflow-hidden">
          {/* Effet de fond */}
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>

          <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">
            ✉️
          </div>

          <h1 className="text-xl font-bold text-white mb-2">Invitation reçue !</h1>
          <p className="text-slate-400 text-sm mb-6">
             Vous avez été invité à rejoindre un serveur sur Velmu.
          </p>

          {error && (
            <div className="bg-red-500/10 text-red-400 text-xs p-2 rounded mb-4 border border-red-500/20">
              {error}
            </div>
          )}

          <button 
            onClick={handleJoin}
            disabled={isLoading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Connexion...
              </>
            ) : (
              "Accepter l'invitation"
            )}
          </button>

          <div className="mt-4 text-xs text-slate-500">
            Code: <span className="font-mono bg-slate-900 px-1 rounded">{code}</span>
          </div>
       </div>
    </div>
  );
}