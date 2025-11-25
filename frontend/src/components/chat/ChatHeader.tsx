import { Channel } from '../../store/serverStore';

interface Props {
  channel: Channel;
  showMembers: boolean;
  onToggleMembers: () => void;
  onMobileBack?: () => void; // Nouvelle prop
}

export default function ChatHeader({ channel, showMembers, onToggleMembers, onMobileBack }: Props) {
  return (
    <div className="h-12 border-b border-background-tertiary flex items-center px-4 shadow-sm bg-background-primary z-10 flex-shrink-0 justify-between select-none transition-colors duration-200 font-sans">
      
      <div className="flex items-center overflow-hidden">
        {/* BOUTON RETOUR MOBILE */}
        <button 
            onClick={onMobileBack}
            className="mr-3 md:hidden text-text-muted hover:text-text-normal p-1 -ml-2"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        {channel.type === 'dm' ? (
           <span className="text-text-muted text-2xl mr-3 font-medium">@</span>
        ) : (
           <svg className="w-6 h-6 text-text-muted mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
        )}
        
        <span className="font-bold text-text-header text-base mr-4 truncate tracking-tight">{channel.name}</span>
        
        {channel.type !== 'dm' && (
            <>
                <div className="h-4 w-[1px] bg-background-tertiary hidden md:block mx-2"></div>
                <span className="text-text-muted text-xs font-medium truncate hidden md:block">Salon textuel</span>
            </>
        )}
      </div>

      <div className="flex items-center gap-4">
         {channel.type !== 'dm' && (
             <button 
               onClick={onToggleMembers} 
               className={`p-1.5 rounded-sm transition-colors ${showMembers ? 'text-text-header' : 'text-text-muted hover:text-text-normal'}`} 
               title={showMembers ? "Masquer la liste des membres" : "Afficher la liste des membres"}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             </button>
         )}
      </div>
    </div>
  );
}