import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // 👈 AJOUT DE LA TAILLE 'xl'
}

// ... (animations CSS inchangées) ...
const styles = `
  @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalSlideUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .animate-modal-fade { animation: modalFadeIn 0.2s ease-out forwards; }
  .animate-modal-slide { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
`;

export default function Modal({ isOpen, onClose, children, size = 'md' }: ModalProps) {
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl', // 👈 NOUVELLE TAILLE LARGE
  };

  return createPortal(
    <>
      <style>{styles}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-modal-fade" 
          onClick={onClose}
        />
        <div 
          className={`
            relative w-full ${sizeClasses[size]} 
            bg-[#1E293B] border border-slate-700/50 rounded-xl shadow-2xl 
            animate-modal-slide overflow-hidden
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}