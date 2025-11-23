import { Channel } from '../../../store/serverStore';

interface Props {
  channel: Channel;
}

export default function ChatWelcome({ channel }: Props) {
  return (
    <div className="mt-12 mb-8 px-4 select-none animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="w-[68px] h-[68px] bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-black/20">
        <span className="text-4xl text-slate-200">#</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">
        Bienvenue dans #{channel.name} !
      </h1>
      <p className="text-slate-400 text-base">
        C'est le début de l'histoire de ce salon. Soyez sympa !
      </p>
    </div>
  );
}