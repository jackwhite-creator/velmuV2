import { useState, useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface UseChatInputProps {
  inputValue: string;
  setInputValue: (val: string | ((prev: string) => string)) => void; // Mise à jour du type pour accepter la fonction callback
  onSendMessage: (e: React.FormEvent, file?: File | null) => void;
  setReplyingTo: (msg: any) => void;
  socket: Socket | null;
}

export const useChatInput = ({
  inputValue,
  setInputValue,
  onSendMessage,
  setReplyingTo,
  socket
}: UseChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  // --- GESTION DES FICHIERS ---

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
        alert("Seules les images sont supportées pour le moment.");
        return;
    }
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    textInputRef.current?.focus();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handlePasteFile = useCallback((file: File) => {
    processFile(file);
  }, [processFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  // --- GESTION GLOBALE (FOCUS & PASTE) ---
  
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Si on est déjà dans un input, textarea ou un élément éditable, on ne fait rien
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Si c'est une touche "caractère" simple (pas Ctrl, Alt, etc.), on focus l'input
      // Cela permet de commencer à taper n'importe où et que ça écrive dans la barre
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        textInputRef.current?.focus();
        // Pas de preventDefault, on laisse le navigateur mettre la lettre dans l'input qui vient d'être focus
      }
    };

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // Si on est déjà dans l'input du chat, React gère déjà le onPaste local, on évite le doublon
      if (target === textInputRef.current) return;
      
      // Si on est dans un autre champ (ex: recherche), on ne touche pas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Sinon, on intercepte le collage global
      const items = e.clipboardData?.items;
      if (!items) return;

      let handled = false;

      // 1. Chercher une image
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handlePasteFile(file);
            handled = true;
            break;
          }
        }
      }

      // 2. Sinon, chercher du texte
      if (!handled) {
        const text = e.clipboardData?.getData('text');
        if (text) {
          e.preventDefault();
          setInputValue((prev: string) => prev + text);
          textInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('paste', handleGlobalPaste);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [handlePasteFile, setInputValue]);


  // --- FONCTIONS UTILITAIRES ---

  const addEmoji = (emoji: any) => {
    setInputValue((prev: string) => prev + emoji.native);
    setShowEmojiPicker(false);
    textInputRef.current?.focus();
  };

  const handleTyping = () => {
    if (!socket) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', false);
    }, 2000);
  };

  const triggerSend = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    // On vérifie juste s'il y a du contenu OU un fichier
    if (!inputValue.trim() && !selectedFile) return;
    
    onSendMessage(e as any, selectedFile);
    
    // Reset
    setInputValue('');
    clearFile();
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('typing', false);
  };

  // Fermeture picker emoji au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
            setShowEmojiPicker(false);
        }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return {
    fileInputRef,
    textInputRef,
    emojiPickerRef,
    selectedFile,
    previewUrl,
    showEmojiPicker,
    setShowEmojiPicker,
    handleFileSelect,
    handlePasteFile,
    clearFile,
    triggerSend,
    handleTyping,
    addEmoji,
    canSend: inputValue.trim().length > 0 || !!selectedFile
  };
};