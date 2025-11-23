import React from 'react';

interface Props {
  replyTo: {
    id: string;
    content: string;
    user: { username: string; avatarUrl: string | null };
  };
  onClick: () => void;
}

export default function MessageReplyHeader({ replyTo, onClick }: Props) {
  return (
    <div className="flex items-center ml-[18px] mb-1 select-none">
      <div className="w-8 h-4 border-l-2 border-t-2 border-slate-600 rounded-tl-md mr-1 self-end mb-2 flex-shrink-0"></div>
      <div 
        onClick={onClick}
        className="flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition min-w-0"
      >
        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
          {replyTo.user.avatarUrl ? (
            <img src={replyTo.user.avatarUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-[9px] text-white font-bold leading-none">
              {replyTo.user.username?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <span className="font-semibold text-xs text-slate-400 hover:text-white hover:underline transition-colors flex-shrink-0">
          @{replyTo.user.username}
        </span>
        <span className="text-xs text-slate-500 truncate hover:text-slate-300 transition-colors">
          {replyTo.content}
        </span>
      </div>
    </div>
  );
}