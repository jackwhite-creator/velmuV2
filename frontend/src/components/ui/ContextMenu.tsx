import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 👈 Import magique

// --- TYPES ---

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  children: React.ReactNode;
}

interface ContextMenuItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

// --- COMPOSANT CONTENEUR ---
export function ContextMenu({ position, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ 
    top: position.y, 
    left: position.x,
    opacity: 0 
  });

  // Calcul de position intelligent
  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let x = position.x;
      let y = position.y;

      // Si ça dépasse à droite
      if (x + rect.width > window.innerWidth) {
        x = x - rect.width;
      }
      
      // Si ça dépasse en bas
      if (y + rect.height > window.innerHeight) {
        y = y - rect.height;
      }

      setStyle({ top: y, left: x, opacity: 1 });
    }
  }, [position]);

  // On utilise createPortal pour sortir le menu du DOM local et le mettre à la racine
  // Cela garantit que le z-index 9999 passe vraiment au-dessus de TOUT (Sidebar incluse)
  return createPortal(
    <>
      {/* 1. LE BACKDROP INVISIBLE (Couvre tout l'écran) */}
      <div 
        className="fixed inset-0 z-[9998] bg-transparent cursor-default"
        // Clic Gauche
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        // Clic Droit (Ferme + Bloque)
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />

      {/* 2. LE MENU LUI-MÊME */}
      <div 
        ref={menuRef}
        className="fixed z-[9999] bg-[#111214] border border-slate-900 rounded-md shadow-xl p-1.5 min-w-[180px] animate-in fade-in duration-75 zoom-in-95"
        style={style}
        onClick={(e) => e.stopPropagation()} 
        onContextMenu={(e) => e.preventDefault()} 
      >
        {children}
      </div>
    </>,
    document.body // 👈 Cible du portail
  );
}

// --- COMPOSANT ITEM ---
export function ContextMenuItem({ label, icon, onClick, variant = 'default' }: ContextMenuItemProps) {
  const baseClass = "flex justify-between items-center px-2 py-2 rounded-sm cursor-pointer text-sm font-medium transition group w-full text-left select-none";
  const variantClass = variant === 'danger' 
    ? "hover:bg-red-500 text-red-400 hover:text-white" 
    : "hover:bg-indigo-600 text-slate-300 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass}`}>
      <span>{label}</span>
      {icon && <span className="ml-4 opacity-70 group-hover:opacity-100">{icon}</span>}
    </button>
  );
}

// --- COMPOSANT SÉPARATEUR ---
export function ContextMenuSeparator() {
  return <div className="h-[1px] bg-slate-700/50 my-1 mx-1"></div>;
}