import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Plus, Bot, Settings, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

interface BotApp {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  createdAt: string;
  bio?: string;
}

export default function DeveloperPortal() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [bots, setBots] = useState<BotApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBotName, setNewBotName] = useState('');

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const res = await api.get('/bots');
      setBots(res.data);
    } catch (error) {
      console.error("Failed to fetch bots", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;

    try {
      const res = await api.post('/bots', { name: newBotName });
      setBots([...bots, res.data.bot]);
      setIsCreating(false);
      setNewBotName('');
      navigate(`/developers/applications/${res.data.bot.id}`);
    } catch (error) {
      console.error("Failed to create bot", error);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full h-screen bg-background-primary overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-header mb-2">Portail Développeur</h1>
            <p className="text-text-muted">Gère tes applications et bots Velmu</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            Nouvelle Application
          </button>
        </div>

        {isCreating && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-background-primary p-6 rounded-md w-full max-w-md shadow-2xl border border-background-tertiary">
              <h2 className="text-xl font-bold text-text-header mb-4">Créer une application</h2>
              <form onSubmit={handleCreateBot}>
                <div className="mb-4">
                  <label className="block text-text-muted text-xs font-bold uppercase mb-2">Nom</label>
                  <input
                    type="text"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    className="w-full bg-background-tertiary text-text-normal p-2 rounded-sm border border-transparent focus:border-brand outline-none transition-colors"
                    placeholder="Mon Super Bot"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-text-normal hover:underline text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-sm text-sm font-medium transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => navigate(`/developers/applications/${bot.id}`)}
              className="bg-background-secondary hover:bg-background-modifier-hover p-4 rounded-md cursor-pointer transition-all group border border-background-tertiary hover:border-brand/50"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center overflow-hidden shrink-0">
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt={bot.username} className="w-full h-full object-cover" />
                  ) : (
                    <Bot size={24} className="text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-text-header font-bold truncate">{bot.username}</h3>
                  <span className="text-text-muted text-xs">Bot • #{bot.discriminator}</span>
                </div>
              </div>
              <div className="text-text-muted text-sm line-clamp-2 mb-4 h-10">
                {bot.bio || "Aucune description."}
              </div>
              <div className="flex items-center text-text-muted text-xs gap-2 group-hover:text-text-normal transition-colors">
                 <Settings size={14} />
                 <span>Gérer l'application</span>
              </div>
            </div>
          ))}
          
          {bots.length === 0 && !loading && (
             <div className="col-span-full text-center py-12 text-text-muted">
                 <Bot size={48} className="mx-auto mb-4 opacity-50" />
                 <p>Tu n'as aucune application pour le moment.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
