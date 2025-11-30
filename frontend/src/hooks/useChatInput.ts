import { useState, useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface UseChatInputProps {
  inputValue: string;
  setInputValue: (val: string | ((prev: string) => string)) => void;
  onSendMessage: (e: React.FormEvent, files?: File[]) => void;
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  // --- GESTION DES FICHIERS ---

  const processFiles = useCallback((files: File[]) => {
    if (selectedFiles.length + files.length > 10) {
        alert("Tu ne peux pas envoyer plus de 10 images à la fois !");
        return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            alert(`Le fichier ${file.name} n'est pas une image valide.`);
            return;
        }
        const url = URL.createObjectURL(file);
        validFiles.push(file);
        newPreviewUrls.push(url);
    });

    if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        textInputRef.current?.focus();
    }
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handlePasteFile = useCallback((file: File) => {
    processFiles([file]);
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
        const newFiles = [...prev];
        newFiles.splice(index, 1);
        return newFiles;
    });
    setPreviewUrls(prev => {
        const newUrls = [...prev];
        URL.revokeObjectURL(newUrls[index]);
        newUrls.splice(index, 1);
        return newUrls;
    });
  }, []);

  const clearFiles = useCallback(() => {
    // Revoke all URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrls]);

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
    if (!inputValue.trim() && selectedFiles.length === 0) return;
    
    onSendMessage(e as any, selectedFiles);
    
    // Reset
    setInputValue('');
    clearFiles();
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
    selectedFiles,
    previewUrls,
    showEmojiPicker,
    setShowEmojiPicker,
    handleFileSelect,
    handlePasteFile,
    clearFiles,
    removeFile,
    triggerSend,
    handleTyping,
    addEmoji,
    canSend: inputValue.trim().length > 0 || selectedFiles.length > 0
  };
};