import React from 'react';
import Modal from './Modal';
import { Message } from '../../hooks/useChat';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  messageData?: Message | null;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDestructive = false,
  messageData
}: ConfirmModalProps) {

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Aujourd'hui à ${timeStr}` : date.toLocaleDateString('fr-FR') + ` ${timeStr}`;
  };

  const modalSize = messageData ? 'md' : 'sm';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <div className="bg-primary text-zinc-200 font-sans flex flex-col shadow-2xl overflow-hidden">
        
        <div className="p-4 pb-2">
          <h2 className="text-xl font-bold text-white mb-2 flex-shrink-0 uppercase tracking-wide text-[15px]">
            {title}
          </h2>
          
          <div className="text-zinc-400 text-[14px] mb-4 leading-snug">
            {message}
          </div>

          {messageData && (
            <div className="mt-2 mb-4 border border-tertiary bg-secondary rounded-[3px] shadow-inner overflow-hidden">
              
              {/* En-tête : Padding-bottom à 0 pour coller le texte */}
              <div className="px-4 pt-3 pb-0 flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-zinc-600 flex-shrink-0 overflow-hidden shadow-sm">
                    {messageData.user.avatarUrl ? (
                        <img src={messageData.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                            {messageData.user.username[0].toUpperCase()}
                        </div>
                    )}
                 </div>
                 <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-white text-[15px] hover:underline cursor-pointer">{messageData.user.username}</span>
                    <span className="text-[11px] text-zinc-500 font-medium">{formatMessageDate(messageData.createdAt)}</span>
                 </div>
              </div>

              {/* Contenu : Marge négative (-mt-1.5) pour remonter le texte sous le pseudo */}
              <div className="pl-[64px] pr-4 pb-4 max-h-[320px] overflow-y-auto custom-scrollbar -mt-1.5">
                 
                 {/* Texte */}
                 {messageData.content && (
                    <div className="text-zinc-300 text-[15px] whitespace-pre-wrap leading-[1.375rem]">
                        {messageData.content}
                    </div>
                 )}

                 {/* Images */}
                 {messageData.attachments && messageData.attachments.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2 items-start">
                        {messageData.attachments.map((att) => (
                            att.type === 'IMAGE' ? (
                                <img 
                                    key={att.id} 
                                    src={att.url} 
                                    alt="suppression" 
                                    className="max-h-60 w-auto max-w-full rounded-[4px] cursor-default object-contain"
                                />
                            ) : (
                                <div key={att.id} className="flex items-center gap-2 bg-tertiary p-3 rounded-[4px] border border-zinc-700/50 w-fit max-w-full">
                                    <div className="text-brand">📄</div>
                                    <span className="text-sm text-zinc-300 truncate font-medium">{att.filename}</span>
                                </div>
                            )
                        ))}
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-secondary p-3 flex justify-end gap-2 border-t border-tertiary">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[3px] text-sm font-medium text-zinc-300 hover:underline transition-all"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`
              px-6 py-2 rounded-[3px] text-sm font-bold text-white shadow-sm transition-colors
              ${isDestructive 
                ? 'bg-status-danger hover:bg-[#a1282c]' 
                : 'bg-brand hover:bg-brand-hover'}
            `}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </Modal>
  );
}