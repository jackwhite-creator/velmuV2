import React from 'react';

interface Props {
  user: { id: string; username: string; avatarUrl?: string | null };
  createdAt: string;
  shouldGroup: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export default function MessageAvatar({ user, createdAt, shouldGroup, onClick }: Props) {
  return (
    <div 
      className="w-10 flex-shrink-0 cursor-pointer z-10 relative" 
      onClick={(e) => !shouldGroup && onClick(e)}
    >
      {!shouldGroup ? (
        <div className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center font-bold text-white overflow-hidden transition shadow-sm active:scale-95">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <img src="/default_avatar.png" alt="" className="w-full h-full object-cover" />
          )}
        </div>
      ) : (
        <div className="text-[10px] text-slate-500 text-right opacity-0 group-hover:opacity-100 w-full pt-1 select-none font-mono">
          {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}