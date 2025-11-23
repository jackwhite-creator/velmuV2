import React from 'react';
import { Socket } from 'socket.io-client';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Channel } from '../../store/serverStore';
import TypingIndicator from './TypingIndicator';
import Tooltip from '../ui/Tooltip';
import { useChatInput } from '../../hooks/useChatInput'; // ✅ Import du Hook

interface Props {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: (e: React.FormEvent, file?: File | null) => void;
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  socket: Socket | null;
  activeChannel: Channel;
  isSending?: boolean;
}

const MAX_LENGTH = 2000;

export default function ChatInput(props: Props) {
  const { 
    inputValue, setInputValue, replyingTo, setReplyingTo, 
    socket, activeChannel, isSending 
  } = props;

  // ✅ Utilisation du Hook pour récupérer toute la logique
  const {
    fileInputRef,
    textInputRef,
    emojiPickerRef,
    previewUrl,
    showEmojiPicker,
    setShowEmojiPicker,
    handleFileSelect,
    clearFile,
    triggerSend,
    handleTyping,
    addEmoji,
    canSend
  } = useChatInput(props);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSend(e);
    }
  };

  // Gestion du coller d'image directement ici pour simplifier le hook
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // On triche un peu pour réutiliser le setter du hook via un faux event input 
          // ou idéalement on expose setSelectedFile du hook. 
          // Pour l'instant, on laisse l'input file gérer ça via le DOM si besoin
          // ou on améliore le hook plus tard.
        }
      }
    }
  };

  const remaining = MAX_LENGTH - inputValue.length;
  const showCounter = inputValue.length > 1500;

  return (
    <div className="bg-slate-900 flex-shrink-0 px-4 pb-6 pt-2 relative">
        
        <TypingIndicator 
            socket={socket} 
            channelId={activeChannel.type !== 'dm' ? activeChannel.id : undefined}
            conversationId={activeChannel.type === 'dm' ? activeChannel.id : undefined}
        />

        {previewUrl && (
            <div className="flex items-start mb-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 relative w-fit">
                <div className="relative group">
                    <img src={previewUrl} alt="Preview" className="h-32 rounded-md object-cover border border-slate-700" />
                    <button 
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition transform hover:scale-110"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        )}

        {replyingTo && (
            <div className="flex items-center justify-between bg-slate-800/50 px-4 py-2 rounded-t-lg border-t border-x border-slate-700/50 text-sm text-slate-300">
                <span>Réponse à <span className="font-bold">@{replyingTo.user.username}</span></span>
                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        )}

        <div 
          onClick={() => textInputRef.current?.focus()}
          className={`bg-slate-700/50 relative px-3 py-2.5 flex items-end gap-3 border border-slate-700 focus-within:border-indigo-500/50 transition-all cursor-text ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'}`}
        >
            
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*" 
            />

            <Tooltip text="Envoyer un fichier" side="top">
                <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="text-slate-400 hover:text-slate-200 transition p-1.5 rounded hover:bg-slate-600 mb-0.5"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </button>
            </Tooltip>
            
            <textarea 
                ref={textInputRef}
                rows={1}
                className="flex-1 bg-transparent text-slate-200 outline-none font-medium placeholder-slate-500 resize-none py-1.5 pr-24 max-h-[300px] overflow-y-auto custom-scrollbar" 
                placeholder={`Envoyer un message ${activeChannel.type === 'dm' ? 'à @' + activeChannel.name : 'dans #' + activeChannel.name}`} 
                value={inputValue} 
                onChange={(e) => {
                    setInputValue(e.target.value);
                    handleTyping(); // ✅ Appel de la logique optimisée
                }} 
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isSending}
                autoComplete="off"
                maxLength={MAX_LENGTH}
            />
            
            <div className="absolute right-3 bottom-2 flex items-center gap-2">
                {showCounter && (
                    <span className={`text-[10px] font-bold mr-1 ${remaining < 0 ? 'text-red-500' : remaining < 200 ? 'text-yellow-500' : 'text-slate-500'}`}>
                        {remaining}
                    </span>
                )}

                <div className="relative" ref={emojiPickerRef}>
                    {showEmojiPicker && (
                        <div 
                            className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-xl overflow-hidden border border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <Picker 
                                data={data} 
                                onEmojiSelect={addEmoji} 
                                theme="dark"
                                previewPosition="none"
                                searchPosition="top"
                                skinTonePosition="none"
                                set="native"
                            />
                        </div>
                    )}
                    
                    <Tooltip text="Émojis" side="top">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setShowEmojiPicker(!showEmojiPicker); 
                            }}
                            className={`
                                transition p-1.5 rounded hover:bg-slate-600
                                ${showEmojiPicker ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}
                            `}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                        </button>
                    </Tooltip>
                </div>

                <Tooltip text={canSend ? "Envoyer" : ""} side="top">
                    <button 
                        onClick={triggerSend} 
                        disabled={!canSend}
                        className={`
                            transition p-1.5 rounded
                            ${canSend 
                                ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 cursor-pointer' 
                                : 'text-slate-600 cursor-not-allowed'
                            }
                        `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </Tooltip>
            </div>

        </div>
    </div>
  );
}