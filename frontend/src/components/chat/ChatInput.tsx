import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import EmojiPicker from './EmojiPicker';

import { Channel, useServerStore } from '../../store/serverStore';
import TypingIndicator from './TypingIndicator';
import Tooltip from '../ui/Tooltip';
import { useChatInput } from '../../hooks/useChatInput';
import MentionList from './MentionList';
import { Permissions } from '@backend/shared/permissions';
import { usePermission } from '../../hooks/usePermission';
import GifPicker from './GifPicker';
import { parseEmoji } from '../../lib/emoji';

interface Props {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: (e: React.FormEvent, files?: File[]) => void;
  onSendGif?: (url: string) => void;
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  socket: Socket | null;
  activeChannel: Channel;
}

const MAX_LENGTH = 2000;

export default function ChatInput(props: Props) {
  const { 
    inputValue, setInputValue, onSendMessage, onSendGif,
    replyingTo, setReplyingTo, socket, activeChannel 
  } = props;

  const { activeServer, activeConversation } = useServerStore();
  
  const {
    fileInputRef,
    textInputRef,
    emojiPickerRef,
    previewUrls,
    showEmojiPicker,
    setShowEmojiPicker,
    handleFileSelect,
    handlePasteFile,
    removeFile,
    triggerSend,
    handleTyping,
    canSend
  } = useChatInput({
    inputValue,
    setInputValue,
    onSendMessage,
    setReplyingTo,
    socket
  });

  const canSendMessages = usePermission(Permissions.SEND_MESSAGES);
  const hasSendPermission = activeChannel.type === 'dm' || canSendMessages;

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{ bottom: number | string; left: number | string }>({ bottom: 40, left: 0 });
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  const [showGifPicker, setShowGifPicker] = useState(false);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync refs
  useEffect(() => {
    if (contentEditableRef.current) {
        (textInputRef as any).current = contentEditableRef.current;
    }
  }, [textInputRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowEmojiPicker]);

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
        .slice(0, 10);

    setFilteredUsers(filtered);
    setMentionIndex(0);
  }, [mentionQuery, activeServer, activeChannel, activeConversation]);

  // Sync inputValue to contentEditable content
  useEffect(() => {
    if (contentEditableRef.current) {
        if (!inputValue) {
            contentEditableRef.current.innerHTML = '';
        } else {
             if (contentEditableRef.current.innerText.trim() === '' && inputValue.trim() !== '') {
                 // contentEditableRef.current.innerText = inputValue;
             }
        }
    }
  }, [inputValue]);

  // Override addEmoji from hook to use our insert logic
  const handleAddEmoji = (emoji: string) => {
      contentEditableRef.current?.focus();
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          const imgHtml = parseEmoji(emoji) as string;
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = imgHtml;
          const img = tempDiv.firstChild;
          
          if (img) {
              range.insertNode(img);
              range.collapse(false);
          }
      } else {
          if (contentEditableRef.current) {
              const imgHtml = parseEmoji(emoji) as string;
              contentEditableRef.current.innerHTML += imgHtml;
          }
      }
      
      updateInputValue();
      setShowEmojiPicker(false);
  };

  const updateInputValue = () => {
      if (!contentEditableRef.current) return;
      
      let text = '';
      const traverse = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
              text += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (el.tagName === 'IMG' && el.classList.contains('emoji')) {
                  text += (el as HTMLImageElement).alt;
              } else if (el.tagName === 'BR') {
                  text += '\n';
              } else {
                  el.childNodes.forEach(traverse);
                  if (el.tagName === 'DIV' || el.tagName === 'P') text += '\n';
              }
          }
      };
      
      contentEditableRef.current.childNodes.forEach(traverse);
      setInputValue(text.trim());
      handleTyping();
  };

  const handleInput = () => {
      updateInputValue();
      
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      if (!selection || !range) return;
      
      // Detect mention
      // Use selection anchorNode to find the text being typed
      if (selection.anchorNode?.nodeType === Node.TEXT_NODE) {
          const nodeText = selection.anchorNode.textContent || '';
          const caretPos = selection.anchorOffset;
          const textBeforeCaret = nodeText.slice(0, caretPos);
          const match = textBeforeCaret.match(/@(\w*)$/);
          
          if (match) {
              const query = match[1];
              setMentionQuery(query);
              
              // Calculate position - Fixed above input on the left
              // We don't need dynamic rect calculation anymore as per user request
              setMentionPosition({ 
                  bottom: '100%', // Fixed above the container
                  left: 72        // Fixed offset to align with textarea (clearing the + button)
              });
          } else {
              setMentionQuery(null);
          }
      } else {
          setMentionQuery(null);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      if (contentEditableRef.current) contentEditableRef.current.innerHTML = '';
    }
  };

  const selectUser = (user: any) => {
      const selection = window.getSelection();
      if (!selection || !selection.anchorNode) return;

      const node = selection.anchorNode;
      if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          const caretPos = selection.anchorOffset;
          
          // Find the start of the mention
          const textBeforeCaret = text.slice(0, caretPos);
          const match = textBeforeCaret.match(/@(\w*)$/);
          
          if (match) {
              const mentionStart = match.index!;
              const mentionEnd = caretPos;
              
              // Create a range to replace the content
              const range = document.createRange();
              range.setStart(node, mentionStart);
              range.setEnd(node, mentionEnd);
              range.deleteContents();
              
              // Insert the mention
              const mentionText = document.createTextNode(`@${user.username} `);
              range.insertNode(mentionText);
              
              // Move cursor to end of inserted text
              range.setStartAfter(mentionText);
              range.setEndAfter(mentionText);
              selection.removeAllRanges();
              selection.addRange(range);
          }
      }
      
      updateInputValue();
      setMentionQuery(null);
  };

  const handleManualSend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inputValue.trim() || previewUrls.length > 0) {
        triggerSend(e as any); // Cast event type if needed
        if (contentEditableRef.current) contentEditableRef.current.innerHTML = '';
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

  const handleGifSelect = (url: string) => {
    setShowGifPicker(false);
    if (onSendGif) {
        onSendGif(url);
    }
  };

  const remaining = MAX_LENGTH - inputValue.length;
  const showCounter = inputValue.length > 1500;

  return (
    <div ref={containerRef} className="bg-background-primary flex-shrink-0 px-4 pb-6 pt-2 relative transition-colors duration-200">
        
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
          onClick={() => contentEditableRef.current?.focus()}
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
            
            <div
                ref={contentEditableRef}
                contentEditable={hasSendPermission}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className={`flex-1 bg-transparent outline-none font-normal text-[15px] py-0.5 pr-32 max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed break-words whitespace-pre-wrap ${!hasSendPermission ? 'text-text-muted cursor-not-allowed' : 'text-text-normal'}`}
                style={{ minHeight: '24px' }}
                data-placeholder={!hasSendPermission ? "Tu n'as pas la permission d'envoyer des messages dans ce salon" : `Envoyer un message ${activeChannel.type === 'dm' ? 'à @' + activeChannel.name : 'dans #' + activeChannel.name}`}
            />
            
            <div className={`absolute right-3 top-2.5 flex items-center gap-2 ${!hasSendPermission ? 'opacity-50 pointer-events-none' : ''}`}>
                {showCounter && (
                    <span className={`text-[10px] font-bold mr-1 ${remaining < 0 ? 'text-status-danger' : remaining < 200 ? 'text-status-warning' : 'text-text-muted'}`}>
                        {remaining}
                    </span>
                )}

                {/* GIF Picker */}
                <div className="relative" ref={gifPickerRef}>
                    {showGifPicker && (
                        <div 
                            className="absolute bottom-full right-0 mb-4 z-50"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
                        </div>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                        className={`transition p-1.5 rounded-sm text-text-muted hover:text-text-normal ${showGifPicker ? 'text-text-normal' : ''}`}
                        title="Envoyer un GIF"
                    >
                        <div className="border-2 border-current rounded-[4px] px-1 text-[10px] font-bold leading-tight">GIF</div>
                    </button>
                </div>

                {/* Emoji Picker */}
                <div className="relative" ref={emojiPickerRef}>
                    {showEmojiPicker && (
                        <div 
                            className="absolute bottom-full right-0 mb-4 z-50"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <EmojiPicker onSelect={handleAddEmoji} onClose={() => setShowEmojiPicker(false)} />
                        </div>
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
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
        <style>{`
            [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: var(--text-muted);
                cursor: text;
            }
        `}</style>
    </div>
  );
}
