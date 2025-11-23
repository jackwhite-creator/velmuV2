import React from 'react';

interface Props {
  isMe: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MessageHoverActions({ isMe, onReply, onEdit, onDelete }: Props) {
  return (
    <div className="opacity-0 group-hover:opacity-100 absolute right-4 -top-3 bg-slate-800 border border-slate-700 rounded shadow-lg flex items-center p-0.5 z-20 transition-opacity duration-150">
      <button onClick={onReply} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition" title="Répondre">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
      </button>
      {isMe && (
        <>
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition" title="Modifier">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition" title="Supprimer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </>
      )}
    </div>
  );
}