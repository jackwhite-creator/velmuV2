import React from 'react';
import { Socket } from 'socket.io-client';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Channel } from '../../store/serverStore';
import TypingIndicator from './TypingIndicator';
import Tooltip from '../ui/Tooltip';
import { useChatInput } from '../../hooks/useChatInput';

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

  const {
    fileInputRef, textInputRef, emojiPickerRef,
    previewUrl, showEmojiPicker, setShowEmojiPicker,
    handleFileSelect, clearFile, triggerSend, handleTyping, addEmoji
  } = useChatInput(props);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) triggerSend(e);
    }
  };

  const handleManualSend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSending && (inputValue.trim() || previewUrl)) {
        props.onSendMessage(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        // Géré par le hook
      }
    }
  };

  const remaining = MAX_LENGTH - inputValue.length;
  const showCounter = inputValue.length > 1500;
  const canSend = (inputValue.trim().length > 0 || previewUrl) && !isSending;

  return (
    // ✅ MIGRATION : Fond principal
    <div className="bg-background-primary flex-shrink-0 px-4 pb-6 pt-2 relative transition-colors duration-200">
        
        <TypingIndicator 
            socket={socket} 
            channelId={activeChannel.type !== 'dm' ? activeChannel.id : undefined}
            conversationId={activeChannel.type === 'dm' ? activeChannel.id : undefined}
        />

        {/* PREVIEW IMAGE */}
        {previewUrl && (
            <div className="flex items-start mb-2 p-4 bg-background-secondary rounded-md border border-background-tertiary relative w-fit">
                <div className="relative group">
                    <img src={previewUrl} alt="Preview" className="h-40 rounded-sm object-cover border border-background-tertiary" />
                    <button 
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 bg-status-danger text-text-header rounded-full p-1 shadow-md hover:brightness-110 transition transform hover:scale-110"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        )}

        {/* BARRE DE RÉPONSE */}
        {replyingTo && (
            <div className="flex items-center justify-between bg-background-secondary px-4 py-2 rounded-t-md border-t border-x border-background-tertiary text-xs font-bold text-text-muted uppercase tracking-wide">
                <div className="flex items-center gap-2">
                    <span className="text-brand">Replying to</span>
                    <span className="text-text-normal">@{replyingTo.user.username}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-text-muted hover:text-text-normal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        )}

        {/* INPUT PRINCIPAL */}
        <div 
          onClick={() => textInputRef.current?.focus()}
          // ✅ MIGRATION : L'input utilise une couleur "secondaire" ou "modifier" pour se démarquer
          className={`bg-background-tertiary relative px-4 py-3 flex items-start gap-3 transition-all cursor-text ${replyingTo ? 'rounded-b-md' : 'rounded-md'}`}
        >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />

            <Tooltip text="Envoyer un fichier" side="top">
                <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="text-text-muted hover:text-text-header transition p-1 rounded-full bg-background-primary hover:bg-background-modifier-hover mt-0.5 flex-shrink-0"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </Tooltip>
            
            <textarea 
                ref={textInputRef}
                rows={1}
                className="flex-1 bg-transparent text-text-normal outline-none font-normal text-[15px] placeholder-text-muted resize-none py-0.5 pr-32 max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed" 
                placeholder={`Envoyer un message ${activeChannel.type === 'dm' ? 'à @' + activeChannel.name : 'dans #' + activeChannel.name}`} 
                value={inputValue} 
                onChange={(e) => { setInputValue(e.target.value); handleTyping(); }} 
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                autoComplete="off"
                maxLength={MAX_LENGTH}
            />
            
            <div className="absolute right-3 top-2.5 flex items-center gap-2">
                {showCounter && (
                    <span className={`text-[10px] font-bold mr-1 ${remaining < 0 ? 'text-status-danger' : remaining < 200 ? 'text-status-warning' : 'text-text-muted'}`}>
                        {remaining}
                    </span>
                )}

                <div className="relative" ref={emojiPickerRef}>
                    {showEmojiPicker && (
                        <div 
                            className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-lg overflow-hidden border border-background-tertiary"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <Picker data={data} onEmojiSelect={addEmoji} theme="dark" previewPosition="none" searchPosition="top" skinTonePosition="none" set="native" />
                        </div>
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                        className={`transition p-1.5 text-text-muted hover:text-status-warning ${showEmojiPicker ? 'text-status-warning' : ''}`}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </button>
                </div>

                <div className={`border-l border-background-secondary pl-2 ml-1 ${canSend ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}>
                    <button
                        onClick={handleManualSend}
                        disabled={!canSend}
                        className={`p-1.5 rounded-sm transition-all duration-200 ${
                            canSend 
                            ? 'text-brand hover:text-text-header hover:bg-brand' 
                            : 'text-text-muted'
                        }`}
                        title="Envoyer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>

            </div>
        </div>
        
        <div className="mt-1 h-3 text-right">
             {isSending && <span className="text-[10px] text-text-muted font-medium animate-pulse">Envoi...</span>}
        </div>
    </div>
  );
}