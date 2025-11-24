import { useState } from 'react';
import { FullProfile } from './UserProfileModal';

interface Props {
  profile: FullProfile;
  isMe: boolean;
}

export default function ProfileInfo({ profile, isMe }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'mutual_servers' | 'mutual_friends'>('info');

  return (
    <>
      {/* NOM ET DISCRIMINATOR */}
      <div className="px-6 mb-4">
         <div className="flex items-baseline gap-1">
             <h2 className="text-2xl font-bold text-white leading-tight">{profile.username}</h2>
             <span className="text-xl text-zinc-400 font-medium">#{profile.discriminator}</span>
         </div>
      </div>

      {/* BARRE DE NAVIGATION (ONGLETS) */}
      <div className="px-6 border-b border-zinc-700/40 flex gap-6">
          <button 
            onClick={() => setActiveTab('info')} 
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'info' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
              Info utilisateur
              {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>}
          </button>
          
          {!isMe && (
              <>
                  <button 
                    onClick={() => setActiveTab('mutual_servers')} 
                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'mutual_servers' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                      Serveurs en commun
                      {activeTab === 'mutual_servers' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('mutual_friends')} 
                    className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'mutual_friends' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                      Amis en commun
                      {activeTab === 'mutual_friends' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full"></div>}
                  </button>
              </>
          )}
      </div>

      {/* CONTENU DES ONGLETS */}
      <div className="flex-1 px-6 py-5 bg-[#18191c] min-h-[180px] flex flex-col">
         
         {activeTab === 'info' && ( 
             <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-200">
                
                {/* A PROPOS DE MOI */}
                <div className="mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wide">À propos de moi</h3>
                    {profile.bio ? (
                         <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    ) : (
                         <p className="text-zinc-500 text-sm italic">Cet utilisateur n'a pas encore de biographie.</p>
                    )}
                </div>

                {/* FOOTER MINIMALISTE : Membre depuis */}
                <div className="mt-auto">
                    <div className="w-full h-[1px] bg-zinc-800/60 my-3"></div>
                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">
                        Membre depuis le <span className="text-zinc-400 normal-case ml-0.5">
                            {profile.createdAt 
                                ? new Date(profile.createdAt).toLocaleDateString('fr-FR') 
                                : "Date inconnue"}
                        </span>
                    </p>
                </div>
             </div> 
         )}

         {activeTab === 'mutual_servers' && ( 
             <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-[#2b2d31] transition cursor-pointer group">
                    <div className="w-10 h-10 rounded-[12px] bg-brand flex items-center justify-center text-white font-bold text-xs group-hover:rounded-[10px] transition-all">VL</div>
                    <div>
                        <div className="text-zinc-200 font-medium text-sm">Velmu Serveur</div>
                        <div className="text-xs text-zinc-500">Serveur Principal</div>
                    </div>
                </div>
             </div> 
         )}

         {activeTab === 'mutual_friends' && ( 
             <div className="flex flex-col items-center justify-center py-6 opacity-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
                 <div className="bg-[#2b2d31] p-3 rounded-full mb-3">
                    <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 </div>
                 <div className="text-zinc-400 text-xs font-medium uppercase tracking-wide">Aucun ami en commun</div>
             </div> 
         )}
      </div>
    </>
  );
}