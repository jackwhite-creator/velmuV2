import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Channel, useServerStore } from '../../store/serverStore';
import TypingIndicator from './TypingIndicator';
import Tooltip from '../ui/Tooltip';
import { useChatInput } from '../../hooks/useChatInput';
import MentionList from './MentionList';
import { Permissions } from '@backend/shared/permissions';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: (e: React.FormEvent, files?: File[]) => void;
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  socket: Socket | null;
  activeChannel: Channel;
}

const MAX_LENGTH = 2000;

export default function ChatInput(props: Props) {
  const { 
    inputValue, setInputValue, onSendMessage, 
    replyingTo, setReplyingTo, socket, activeChannel 
  } = props;

  const { activeServer, activeConversation } = useServerStore();
  
  // Use the custom hook for input logic
  const {
    fileInputRef,
    textInputRef,
    emojiPickerRef,
    selectedFiles,
    previewUrls,
    showEmojiPicker,
    setShowEmojiPicker,
    handleFileSelect,
    handlePasteFile,
    removeFile,
    triggerSend,
    handleTyping,
    addEmoji,
    canSend
  } = useChatInput({
    inputValue,
    setInputValue,
    onSendMessage,
    setReplyingTo,
    socket
  });

  // Permission check
  const canSendMessages = usePermission(Permissions.SEND_MESSAGES);
  const hasSendPermission = activeChannel.type === 'dm' || canSendMessages;

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ bottom: 40, left: 0 });
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  useEffect(() => {
    if (mentionQuery === null) {
        setFilteredUsers([]);
        return;
    }

    let users: any[] = [];
    if (activeChannel.type === 'dm' && activeConversation) {
        users = activeConversation.users || [];
    } else if (activeServer?.members) {
        users = activeServer.members.map((m: any) => m.user);
    }

    const lowerQuery = mentionQuery.toLowerCase();
    const filtered = users
        .filter(u => u.username.toLowerCase().includes(lowerQuery))
        .slice(0, 10); // Limit to 10

    setFilteredUsers(filtered);
    setMentionIndex(0);
  }, [mentionQuery, activeServer, activeChannel, activeConversation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (filteredUsers.length > 0) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionIndex(prev => (prev > 0 ? prev - 1 : filteredUsers.length - 1));
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionIndex(prev => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            selectUser(filteredUsers[mentionIndex]);
            return;
        }
        if (e.key === 'Escape') {
            setMentionQuery(null);
            return;
        }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSend(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);
    handleTyping();

    // Mention logic
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1) {
        const query = textBeforeCursor.slice(lastAt + 1);
        if (!query.includes(' ') && query.length > 0) {
            setMentionQuery(query);
            
            // Calculate position
            // This is a simplified calculation. For production, use a library like textarea-caret
            setMentionPosition({ bottom: 60, left: 20 }); 
        } else {
            setMentionQuery(null);
        }
    } else {
        setMentionQuery(null);
    }
    
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`;
  };

  const selectUser = (user: any) => {
    if (!user) return;
    const cursor = textInputRef.current?.selectionStart || 0;
    const text = inputValue;
    const lastAt = text.lastIndexOf('@', cursor - 1);
    
    const newText = text.substring(0, lastAt) + `@${user.username} ` + text.substring(cursor);
    setInputValue(newText);
    setMentionQuery(null);
    textInputRef.current?.focus();
  };

  const handleManualSend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inputValue.trim() || previewUrls.length > 0) {
        triggerSend(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
            handlePasteFile(file);
        }
        return;
      }
    }
  };

  const remaining = MAX_LENGTH - inputValue.length;
  const showCounter = inputValue.length > 1500;

  return (
    <div className="bg-background-primary flex-shrink-0 px-4 pb-6 pt-2 relative transition-colors duration-200">
        
        {filteredUsers.length > 0 && (
            <MentionList 
                users={filteredUsers} 
                selectedIndex={mentionIndex} 
                onSelect={selectUser} 
                onClose={() => setMentionQuery(null)}
                position={mentionPosition}
            />
        )}

        <TypingIndicator 
            socket={socket} 
            channelId={activeChannel.type !== 'dm' ? activeChannel.id : undefined}
            conversationId={activeChannel.type === 'dm' ? activeChannel.id : undefined}
        />

        {previewUrls.length > 0 && (
            <div className="flex items-start gap-2 mb-2 p-4 bg-background-secondary rounded-md border border-background-tertiary relative w-fit max-w-full overflow-x-auto animate-in slide-in-from-bottom-2 fade-in duration-200 custom-scrollbar">
                {previewUrls.map((url, index) => (
                    <div key={index} className="relative group flex-shrink-0">
                        <img src={url} alt={`Preview ${index}`} className="h-48 rounded-sm object-contain border border-background-tertiary bg-background-tertiary" />
                        <button 
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-status-danger text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                            title="Supprimer l'image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                ))}
            </div>
        )}

        {replyingTo && (
            <div className="flex items-center justify-between bg-background-secondary px-4 py-2 rounded-t-md border-t border-x border-background-tertiary text-xs font-bold text-text-muted uppercase tracking-wide animate-in slide-in-from-bottom-1">
                <div className="flex items-center gap-2 truncate">
                    <span className="text-text-muted">Réponse à</span>
                    <span className="text-text-normal">@{replyingTo.user.username}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-text-muted hover:text-text-normal transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        )}

        <div 
          onClick={() => textInputRef.current?.focus()}
          className={`bg-background-tertiary relative px-4 py-3 flex items-start gap-3 transition-all cursor-text ${replyingTo ? 'rounded-b-md' : 'rounded-md'}`}
        >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" multiple />

            <Tooltip text="Envoyer un fichier" side="top">
                <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="text-text-muted hover:text-text-normal transition p-1 rounded-full hover:bg-background-primary mt-0.5 flex-shrink-0"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </button>
            </Tooltip>
            
            <textarea 
                ref={textInputRef}
                rows={1}
                disabled={!hasSendPermission}
                className={`flex-1 bg-transparent outline-none font-normal text-[15px] resize-none py-0.5 pr-32 max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed ${!hasSendPermission ? 'text-text-muted cursor-not-allowed placeholder-text-muted' : 'text-text-normal placeholder-text-muted'}`}
                placeholder={!hasSendPermission ? "Tu n'as pas la permission d'envoyer des messages dans ce salon" : `Envoyer un message ${activeChannel.type === 'dm' ? 'à @' + activeChannel.name : 'dans #' + activeChannel.name}`}
                value={inputValue} 
                onChange={handleChange} 
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                autoComplete="off"
                maxLength={MAX_LENGTH}
            />
            
            <div className={`absolute right-3 top-2.5 flex items-center gap-2 ${!hasSendPermission ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        className={`transition p-1.5 text-text-muted hover:text-yellow-400 ${showEmojiPicker ? 'text-yellow-400' : ''}`}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </button>
                </div>

                <div className={`border-l border-background-modifier-accent pl-2 ml-1 ${canSend ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}>
                    <button
                        onClick={handleManualSend}
                        disabled={!canSend}
                        className={`p-1.5 rounded-sm transition-all duration-200 ${
                            canSend 
                            ? 'text-brand hover:text-white' 
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
    </div>
  );
}