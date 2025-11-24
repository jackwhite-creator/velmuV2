import { Channel } from '../../../store/serverStore';

interface Props {
  channel: Channel;
}

export default function ChatWelcome({ channel }: Props) {
  const isDm = channel.type === 'dm';
  
  return (
    <div className="mt-12 mb-6 px-4 select-none animate-in fade-in duration-500 slide-in-from-bottom-2 font-sans">
      
      {/* CORRECTION ICI : Fond plus clair (zinc-700) et icône blanche */}
      <div className="w-[68px] h-[68px] bg-zinc-700 rounded-[22px] flex items-center justify-center mb-4 shadow-sm">
        {isDm ? (
           <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        ) : (
           <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
        )}
      </div>

      <h1 className="text-[32px] font-bold text-text-header mb-1 tracking-tight leading-tight">
        Bienvenue dans {isDm ? '' : '#'}{channel.name} !
      </h1>
      
      <p className="text-text-muted text-base font-medium">
        C'est le début de l'histoire de {isDm ? 'cette conversation' : 'ce salon'}.
      </p>

    </div>
  );
}