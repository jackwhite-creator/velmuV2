import { Channel } from '../../store/serverStore';

interface Props {
  channel: Channel;
  showMembers: boolean;
  onToggleMembers: () => void;
}

export default function ChatHeader({ channel, showMembers, onToggleMembers }: Props) {
  return (
    <div className="h-12 border-b border-slate-800 flex items-center px-4 shadow-sm bg-slate-900 z-10 flex-shrink-0 justify-between">
      <div className="flex items-center overflow-hidden">
        {channel.type === 'dm' ? (
           <span className="text-slate-400 text-xl mr-2">@</span>
        ) : (
           <span className="text-slate-400 text-2xl mr-2 font-thin">#</span>
        )}
        <span className="font-bold text-white mr-4 truncate">{channel.name}</span>
        {channel.type !== 'dm' && (
            <>
                <div className="h-6 w-[1px] bg-slate-700 hidden md:block"></div>
                <span className="text-slate-400 text-xs ml-4 truncate hidden md:block">Salon textuel</span>
            </>
        )}
      </div>

      <div className="flex items-center gap-3">
         {channel.type !== 'dm' && (
             <button 
               onClick={onToggleMembers} 
               className={`p-1.5 rounded transition ${showMembers ? 'text-white bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`} 
               title="Membres"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             </button>
         )}
      </div>
    </div>
  );
}