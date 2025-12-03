import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Bot, RefreshCw, Save, Trash2, Copy, Check, Shield, ExternalLink, ArrowLeft } from 'lucide-react';

interface BotApp {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  createdAt: string;
}

const PERMISSIONS = [
  { id: 'ADMINISTRATOR', name: 'Administrateur', description: 'Donne toutes les permissions (dangereux)' },
  { id: 'MANAGE_SERVER', name: 'Gérer le serveur', description: 'Modifier le nom, les rôles, etc.' },
  { id: 'MANAGE_ROLES', name: 'Gérer les rôles', description: 'Créer, modifier et supprimer des rôles' },
  { id: 'MANAGE_CHANNELS', name: 'Gérer les salons', description: 'Créer, modifier et supprimer des salons' },
  { id: 'KICK_MEMBERS', name: 'Expulser des membres', description: 'Expulser des membres du serveur' },
  { id: 'BAN_MEMBERS', name: 'Bannir des membres', description: 'Bannir des membres du serveur' },
  { id: 'SEND_MESSAGES', name: 'Envoyer des messages', description: 'Envoyer des messages dans les salons textuels' },
  { id: 'MANAGE_MESSAGES', name: 'Gérer les messages', description: 'Supprimer les messages des autres' },
  { id: 'VIEW_CHANNELS', name: 'Voir les salons', description: 'Voir les salons (par défaut)' },
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<BotApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'oauth2' | 'bot'>('general');
  
  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  
  // Token state
  const [token, setToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  
  // OAuth2 state
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['VIEW_CHANNELS', 'SEND_MESSAGES']);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBot();
  }, [id]);

  useEffect(() => {
    if (bot) {
      setName(bot.username);
      setBio(bot.bio || '');
      setAvatarUrl(bot.avatarUrl || '');
      setBannerUrl(bot.bannerUrl || '');
      generateInviteUrl();
    }
  }, [bot, selectedPermissions]);

  const fetchBot = async () => {
    try {
      const res = await api.get('/bots');
      const found = res.data.find((b: any) => b.id === id);
      if (found) {
        setBot(found);
      } else {
        navigate('/developers/applications');
      }
    } catch (error) {
      console.error("Failed to fetch bot", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.patch(`/bots/${id}`, {
        name,
        bio,
        avatarUrl,
        bannerUrl
      });
      setBot(res.data);
      alert("Modifications enregistrées !");
    } catch (error) {
      console.error("Failed to update bot", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleResetToken = async () => {
    if (!confirm("Êtes-vous sûr ? L'ancien token cessera de fonctionner immédiatement.")) return;
    try {
      const res = await api.post(`/bots/${id}/token`);
      setToken(res.data.token);
      setShowToken(true);
    } catch (error) {
      console.error("Failed to reset token", error);
    }
  };

  const handleDelete = async () => {
    const confirmName = prompt(`Pour confirmer la suppression, tapez le nom du bot : ${bot?.username}`);
    if (confirmName !== bot?.username) return;

    try {
      await api.delete(`/bots/${id}`);
      navigate('/developers/applications');
    } catch (error) {
      console.error("Failed to delete bot", error);
    }
  };

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const generateInviteUrl = () => {
    if (!bot) return;
    const baseUrl = window.location.origin;
    // We encode permissions as comma separated string for simplicity in this demo
    // In real OAuth2, this would be a bitmask integer
    const perms = selectedPermissions.join(',');
    const url = `${baseUrl}/oauth2/authorize?client_id=${bot.id}&permissions=${perms}`;
    setGeneratedUrl(url);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !bot) return <div className="p-8 text-text-normal">Chargement...</div>;

  return (
    <div className="w-full h-screen bg-background-primary overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-8">
        <button 
          onClick={() => navigate('/developers/applications')}
          className="flex items-center text-text-muted hover:text-text-normal mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} className="mr-2" />
          Retour aux applications
        </button>

        <div className="flex items-start gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center overflow-hidden shrink-0">
             {bot.avatarUrl ? (
               <img src={bot.avatarUrl} alt={bot.username} className="w-full h-full object-cover" />
             ) : (
               <Bot size={48} className="text-white" />
             )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-header mb-2">{bot.username}</h1>
            <div className="flex gap-2">
               <span className="bg-brand text-white text-xs px-2 py-1 rounded uppercase font-bold">Bot</span>
               <span className="text-text-muted text-sm py-1 font-mono">ID: {bot.id}</span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-background-tertiary mb-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'text-text-header border-brand' : 'text-text-muted border-transparent hover:text-text-normal hover:border-background-modifier-hover'}`}
          >
            Général
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'bot' ? 'text-text-header border-brand' : 'text-text-muted border-transparent hover:text-text-normal hover:border-background-modifier-hover'}`}
          >
            Bot & Token
          </button>
          <button
            onClick={() => setActiveTab('oauth2')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'oauth2' ? 'text-text-header border-brand' : 'text-text-muted border-transparent hover:text-text-normal hover:border-background-modifier-hover'}`}
          >
            OAuth2 & Invitation
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-background-secondary p-6 rounded-md border border-background-tertiary">
              <h2 className="text-xl font-bold text-text-header mb-6">Informations Générales</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-text-muted text-xs font-bold uppercase mb-2">Nom de l'application</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background-tertiary text-text-normal p-3 rounded-sm border border-transparent focus:border-brand outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-text-muted text-xs font-bold uppercase mb-2">Description (Bio)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-background-tertiary text-text-normal p-3 rounded-sm border border-transparent focus:border-brand outline-none transition-colors min-h-[100px]"
                    placeholder="Décris ton bot..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-text-muted text-xs font-bold uppercase mb-2">Avatar URL</label>
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full bg-background-tertiary text-text-normal p-3 rounded-sm border border-transparent focus:border-brand outline-none transition-colors"
                        placeholder="https://..."
                      />
                   </div>
                   <div>
                      <label className="block text-text-muted text-xs font-bold uppercase mb-2">Bannière URL</label>
                      <input
                        type="text"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        className="w-full bg-background-tertiary text-text-normal p-3 rounded-sm border border-transparent focus:border-brand outline-none transition-colors"
                        placeholder="https://..."
                      />
                   </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-status-positive hover:bg-status-positive/90 text-white px-6 py-2 rounded-sm font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <Save size={16} />
                  Enregistrer les modifications
                </button>
              </div>
            </div>

            <div className="bg-background-secondary p-6 rounded-md border border-status-danger/30">
              <h2 className="text-xl font-bold text-text-header mb-4">Zone de Danger</h2>
              <p className="text-text-muted mb-4 text-sm">La suppression de l'application est irréversible.</p>
              <button
                onClick={handleDelete}
                className="bg-status-danger hover:bg-status-danger/90 text-white px-4 py-2 rounded-sm font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Supprimer l'application
              </button>
            </div>
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-background-secondary p-6 rounded-md border border-background-tertiary">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-text-header">Token du Bot</h2>
                 <Bot className="text-text-muted" />
               </div>
               
               <p className="text-text-muted mb-6 text-sm">
                 Ce token permet à ton bot de se connecter à l'API. Ne le partage jamais avec personne !
               </p>

               {token ? (
                 <div className="bg-background-tertiary p-4 rounded-sm border border-brand mb-6">
                    <p className="text-brand font-bold mb-2 text-sm uppercase">Nouveau Token Généré :</p>
                    <div className="flex items-center gap-2 bg-black/30 p-2 rounded">
                       <code className="flex-1 font-mono text-sm break-all text-white">{token}</code>
                       <button onClick={() => navigator.clipboard.writeText(token)} className="text-text-muted hover:text-text-normal">
                         <Copy size={18} />
                       </button>
                    </div>
                    <p className="text-status-danger text-xs mt-2 font-bold">Copie-le maintenant, il ne sera plus jamais affiché !</p>
                 </div>
               ) : (
                 <div className="bg-background-tertiary p-4 rounded-sm mb-6 flex items-center justify-between filter blur-[4px] select-none hover:blur-0 transition-all duration-300">
                    <code className="text-text-muted">********************************************************</code>
                    <button className="text-text-muted" disabled>Copier</button>
                 </div>
               )}

               <button
                 onClick={handleResetToken}
                 className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-sm font-medium transition-colors flex items-center gap-2 text-sm"
               >
                 <RefreshCw size={16} />
                 Réinitialiser le Token
               </button>
             </div>
          </div>
        )}

        {activeTab === 'oauth2' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-background-secondary p-6 rounded-md border border-background-tertiary">
               <h2 className="text-xl font-bold text-text-header mb-6">Générateur d'URL d'invitation</h2>
               <p className="text-text-muted mb-6 text-sm">
                 Sélectionne les permissions dont ton bot a besoin. Une URL sera générée pour l'inviter sur les serveurs.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 {PERMISSIONS.map((perm) => (
                   <div 
                     key={perm.id}
                     onClick={() => togglePermission(perm.id)}
                     className={`p-3 rounded-sm border cursor-pointer transition-all flex items-start gap-3 ${
                       selectedPermissions.includes(perm.id) 
                         ? 'bg-brand/10 border-brand' 
                         : 'bg-background-tertiary border-transparent hover:border-text-muted'
                     }`}
                   >
                     <div className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedPermissions.includes(perm.id) ? 'bg-brand' : 'bg-background-secondary border border-text-muted'
                     }`}>
                        {selectedPermissions.includes(perm.id) && <Check size={14} className="text-white" />}
                     </div>
                     <div>
                       <div className="text-text-normal font-medium text-sm">{perm.name}</div>
                       <div className="text-text-muted text-xs">{perm.description}</div>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="bg-background-tertiary p-4 rounded-sm">
                 <label className="block text-text-muted text-xs font-bold uppercase mb-2">URL d'invitation générée</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="text" 
                     readOnly 
                     value={generatedUrl}
                     className="flex-1 bg-black/30 text-text-normal p-2 rounded-sm border border-transparent focus:border-brand outline-none font-mono text-sm"
                   />
                   <button 
                     onClick={copyUrl}
                     className={`p-2 rounded-sm transition-colors ${copied ? 'bg-status-positive text-white' : 'bg-brand text-white hover:bg-brand-hover'}`}
                   >
                     {copied ? <Check size={20} /> : <Copy size={20} />}
                   </button>
                   <a 
                     href={generatedUrl} 
                     target="_blank" 
                     rel="noreferrer"
                     className="p-2 bg-background-secondary text-text-muted hover:text-text-normal rounded-sm hover:bg-background-modifier-hover transition-colors"
                   >
                     <ExternalLink size={20} />
                   </a>
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
