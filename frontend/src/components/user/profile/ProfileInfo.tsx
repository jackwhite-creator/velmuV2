import { useState } from 'react';
import { FullProfile } from './UserProfileModal';
import Badge from '../../ui/Badge';

interface Props {
  profile: FullProfile;
  isMe: boolean;
  badges?: any[];
}

export default function ProfileInfo({ profile, isMe, badges = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'mutual_servers' | 'mutual_friends'>('info');

  return (
    <>
      {/* NOM ET DISCRIMINATOR */}
      <div className="px-6 mb-4">
         <div className="flex items-center gap-3">
             <div className="flex items-baseline gap-1">
                 <h2 className="text-2xl font-bold text-text-header leading-none">{profile.username}</h2>
                 <span className="text-xl text-text-muted font-medium leading-none">#{profile.discriminator}</span>
             </div>
             
             {/* BADGES */}
             {badges && badges.length > 0 && (
                 <div className="flex items-center gap-2">
                     {badges.map(badge => (
                         <Badge 
                             key={badge.id} 
                             name={badge.name} 
                             iconUrl={badge.iconUrl} 
                             size="md"
                         />
                     ))}
                 </div>
             )}
         </div>
      </div>

      {/* BARRE DE NAVIGATION (ONGLETS) */}
      <div className="px-6 border-b border-background-tertiary flex gap-6">
          <button 
            onClick={() => setActiveTab('info')} 
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'info' ? 'text-text-header' : 'text-text-muted hover:text-text-normal'}`}
          >
              Info utilisateur
              {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>}
          </button>
          
          {!isMe && (
              <>
                  <button 
                    onClick={() => setActiveTab('mutual_servers')} 
                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'mutual_servers' ? 'text-text-header' : 'text-text-muted hover:text-text-normal'}`}
                  >
                      Serveurs en commun
                      {activeTab === 'mutual_servers' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('mutual_friends')} 
                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'mutual_friends' ? 'text-text-header' : 'text-text-muted hover:text-text-normal'}`}
                  >
                      Amis en commun
                      {activeTab === 'mutual_friends' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>}
                  </button>
              </>
          )}
      </div>

      {/* CONTENU DES ONGLETS */}
      <div className="flex-1 px-6 py-5 bg-floating min-h-[180px] flex flex-col">
         
         {activeTab === 'info' && ( 
             <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-200">
                
                {/* A PROPOS DE MOI */}
                <div className="mb-2">
                    <h3 className="text-xs font-bold text-text-muted uppercase mb-2 tracking-wide">À propos de moi</h3>
                    {profile.bio ? (
                         <p className="text-text-normal text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    ) : (
                         <p className="text-text-muted text-sm italic">Cet utilisateur n'a pas encore de biographie.</p>
                    )}
                </div>

                {/* FOOTER MINIMALISTE : Membre depuis */}
                <div className="mt-auto">
                    <div className="w-full h-[1px] bg-background-modifier-accent my-3"></div>
                    <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">
                        Membre depuis le <span className="text-text-normal normal-case ml-0.5">
                            {profile.createdAt 
                                ? new Date(profile.createdAt).toLocaleDateString('fr-FR') 
                                : "Date inconnue"}
                        </span>
                    </p>
                </div>
             </div> 
         )}

         {activeTab === 'mutual_servers' && ( 
             <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {profile.mutualServers && profile.mutualServers.length > 0 ? (
                    profile.mutualServers.map(server => (
                        <div 
                            key={server.id}
                            onClick={() => window.location.href = `/channels/${server.id}`}
                            className="flex items-center gap-3 p-2 rounded-sm hover:bg-background-modifier-hover transition cursor-pointer group"
                        >
                            {server.iconUrl ? (
                                <img src={server.iconUrl} alt={server.name} className="w-10 h-10 rounded-[12px] object-cover group-hover:rounded-[10px] transition-all" />
                            ) : (
                                <div className="w-10 h-10 rounded-[12px] bg-brand flex items-center justify-center text-white font-bold text-xs group-hover:rounded-[10px] transition-all">
                                    {server.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="text-text-normal font-medium text-sm">{server.name}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 opacity-50">
                        <div className="text-text-muted text-xs font-medium uppercase tracking-wide">Aucun serveur en commun</div>
                    </div>
                )}
             </div> 
         )}

         {activeTab === 'mutual_friends' && ( 
             <div className="flex flex-col items-center justify-center py-6 opacity-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
                 <div className="bg-background-secondary p-3 rounded-full mb-3">
                    <svg className="w-6 h-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 </div>
                 <div className="text-text-muted text-xs font-medium uppercase tracking-wide">Aucun ami en commun</div>
             </div> 
         )}
      </div>
    </>
  );
}