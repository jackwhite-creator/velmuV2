import { Channel } from '../../store/serverStore';

interface Props {
  channel: Channel;
  showMembers: boolean;
  onToggleMembers: () => void;
}

export default function ChatHeader({ channel, showMembers, onToggleMembers }: Props) {
  return (
    // ✅ FOND ZINC CLASSIQUE (#313338)
    <div className="h-14 border-b border-[#26272d] flex items-center px-6 shadow-sm bg-[#313338] z-10 flex-shrink-0 justify-between select-none">
      <div className="flex items-center overflow-hidden">
        {channel.type === 'dm' ? (
           // Icône @ plus discrète
           <span className="text-zinc-400 text-xl mr-3 font-medium">@</span>
        ) : (
           // Icône # style "Code"
           <svg className="w-6 h-6 text-zinc-400 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
        )}
        
        {/* Titre Blanc pur et gras */}
        <span className="font-bold text-zinc-100 text-lg mr-4 truncate">{channel.name}</span>
        
        {channel.type !== 'dm' && (
            <>
                <div className="h-5 w-[1px] bg-zinc-700 hidden md:block mx-2"></div>
                <span className="text-zinc-400 text-xs font-medium truncate hidden md:block">Salon textuel</span>
            </>
        )}
      </div>

      <div className="flex items-center gap-4">
         {channel.type !== 'dm' && (
             <button 
               onClick={onToggleMembers} 
               className={`p-1.5 rounded-sm transition-colors ${showMembers ? 'text-zinc-100 bg-zinc-700' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`} 
               title="Liste des membres"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             </button>
         )}
      </div>
    </div>
  );
}