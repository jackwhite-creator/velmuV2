import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { Channel } from '../store/serverStore';

interface UseChatInputProps {
  socket: Socket | null;
  activeChannel: Channel;
  onSendMessage: (e: React.FormEvent, file?: File | null) => void;
  setInputValue: (val: string) => void;
  inputValue: string;
  isSending?: boolean;
}

// Configuration "Discord-like"
const TYPING_THROTTLE = 8000; // On renvoie "Start" max toutes les 8s
const TYPING_TIMEOUT = 10000; // On considère qu'il a arrêté après 10s d'inactivité

export const useChatInput = ({ 
  socket, activeChannel, onSendMessage, setInputValue, inputValue, isSending 
}: UseChatInputProps) => {
  const { user } = useAuthStore();
  
  // Refs pour les éléments DOM
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null); 
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Refs pour la logique interne
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // États
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // --- GESTION DU TYPING (La correction est ici) ---
  const handleTyping = () => {
    if (!socket || !user) return;

    const now = Date.now();
    const payload = { 
      channelId: activeChannel.type !== 'dm' ? activeChannel.id : undefined,
      conversationId: activeChannel.type === 'dm' ? activeChannel.id : undefined,
      username: user.username,
      userId: user.id
    };

    // 1. Envoi immédiat si le délai de throttle est passé (ou si premier caractère)
    if (now - lastTypingSentRef.current > TYPING_THROTTLE) {
      socket.emit('typing_start', payload);
      lastTypingSentRef.current = now;
    }

    // 2. Reset du timer d'arrêt automatique
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', payload);
    }, TYPING_TIMEOUT);
  };

  const stopTypingImmediately = () => {
    if (!socket || !user) return;
    const payload = { 
      channelId: activeChannel.type !== 'dm' ? activeChannel.id : undefined,
      conversationId: activeChannel.type === 'dm' ? activeChannel.id : undefined,
      userId: user.id
    };
    socket.emit('typing_stop', payload);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // ✅ CRUCIAL : On reset le throttle pour que le prochain caractère
    // déclenche immédiatement un nouveau "typing_start"
    lastTypingSentRef.current = 0; 
  };

  // --- GESTION DES FICHIERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      textInputRef.current?.focus();
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- GESTION DE L'ENVOI ---
  const canSend = (inputValue.trim().length > 0 || selectedFile !== null) && !isSending;

  const triggerSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    
    onSendMessage(e, selectedFile);
    stopTypingImmediately(); // ✅ On coupe le typing tout de suite
    clearFile();
    setShowEmojiPicker(false);
    
    // Reset hauteur textarea
    if (textInputRef.current) textInputRef.current.style.height = 'auto';
    
    // Keep focus
    setTimeout(() => textInputRef.current?.focus(), 10);
  };

  // --- HELPERS ---
  const addEmoji = (emoji: any) => {
    const cursor = textInputRef.current?.selectionStart || inputValue.length;
    const text = inputValue.slice(0, cursor) + emoji.native + inputValue.slice(cursor);
    setInputValue(text);
    handleTyping(); // Ajouter un émoji compte comme taper
    setTimeout(() => textInputRef.current?.focus(), 10);
  };

  // --- EFFECTS ---
  // Focus global
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
      const active = document.activeElement as HTMLElement;
      if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) return;
      textInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Auto-Resize
  useEffect(() => {
    const el = textInputRef.current;
    if (el) {
      el.style.height = 'auto'; 
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
    }
  }, [inputValue]);

  // Click Outside Emoji
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  return {
    fileInputRef,
    textInputRef,
    emojiPickerRef,
    selectedFile,
    previewUrl,
    showEmojiPicker,
    setShowEmojiPicker,
    handleFileSelect,
    clearFile,
    handlePaste: (e: React.ClipboardEvent) => { /* ... logique paste simplifiée ... */ },
    triggerSend,
    handleTyping,
    addEmoji,
    canSend
  };
};