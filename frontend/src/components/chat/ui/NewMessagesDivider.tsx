import React from 'react';

export default function NewMessagesDivider() {
  return (
    <div className="w-[calc(100%-2rem)] mx-4 h-0 border-t border-status-danger relative flex items-center justify-end my-2 opacity-90">
      <span className="bg-status-danger text-white text-[9px] font-bold px-1 py-[1px] rounded-l-sm uppercase tracking-wider absolute right-0 -top-1.5 select-none">
        Nouveau
      </span>
    </div>
  );
}
