import React from 'react';
import Modal from './Modal';

export interface MessagePreviewData {
  content: string;
  createdAt: string;
  user: {
    username: string;
    avatarUrl?: string | null;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  isDestructive?: boolean;
  confirmText?: string;
  messageData?: MessagePreviewData | null;
}

export default function ConfirmModal({ 
  isOpen, onClose, onConfirm, 
  title, message, isDestructive = false, confirmText = "Confirmer",
  messageData
}: Props) {

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Aujourd'hui" : `Aujourd'hui à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <div className="p-6 flex flex-col gap-4">
            
            {/* TITRE */}
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>

            {/* TEXTE EXPLICATIF */}
            <div className="text-slate-400 text-sm leading-relaxed">
                {message}
            </div>

            {/* 👇 APERÇU DU MESSAGE (Style Amélioré) */}
            {messageData && (
                <div className="
                    mt-2 mb-2 p-3 rounded-lg flex gap-3 select-none relative overflow-hidden
                    bg-slate-950/30 border border-slate-800/60 
                    shadow-lg shadow-black/20 
                ">
                    {/* Petite barre latérale rouge si c'est destructif, juste pour le style */}
                    {isDestructive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500/50"></div>}

                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mt-0.5 ml-1">
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden text-white font-bold text-xs ring-2 ring-black/20">
                            {messageData.user.avatarUrl ? (
                                <img src={messageData.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                messageData.user.username[0].toUpperCase()
                            )}
                        </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-slate-200 text-sm">{messageData.user.username}</span>
                            <span className="text-[10px] text-slate-500">{formatTime(messageData.createdAt)}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed break-words opacity-90">
                            {messageData.content}
                        </p>
                    </div>
                </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-700/30">
                <button 
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-all"
                >
                    Annuler
                </button>
                
                <button 
                    onClick={handleConfirm}
                    className={`
                        px-6 py-2.5 text-sm font-bold text-white rounded-md transition-all shadow-lg
                        ${isDestructive 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20' 
                            : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-900/20'}
                    `}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </Modal>
  );
}