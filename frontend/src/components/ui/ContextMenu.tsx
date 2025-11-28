import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// --- TYPES ---

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  children: React.ReactNode;
}

interface ContextMenuItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  children?: React.ReactNode; // For nested menus
  disabled?: boolean;
}

// --- COMPOSANT CONTENEUR ---
export function ContextMenu({ position, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ 
    top: position.y, 
    left: position.x,
    opacity: 0 
  });

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let x = position.x;
      let y = position.y;

      if (x + rect.width > window.innerWidth) x = x - rect.width;
      if (y + rect.height > window.innerHeight) y = y - rect.height;

      setStyle({ top: y, left: x, opacity: 1 });
    }
  }, [position]);

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-transparent cursor-default"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
      />
      <div 
        ref={menuRef}
        className="fixed z-[9999] bg-[#111214] border border-zinc-900 rounded-md shadow-xl p-1.5 min-w-[188px] animate-in fade-in duration-75 zoom-in-95 text-zinc-300"
        style={style}
        onClick={(e) => e.stopPropagation()} 
        onContextMenu={(e) => e.preventDefault()} 
      >
        {children}
      </div>
    </>,
    document.body
  );
}

// --- COMPOSANT ITEM ---
export function ContextMenuItem({ label, icon, onClick, variant = 'default', children, disabled }: ContextMenuItemProps) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const itemRef = useRef<HTMLButtonElement>(null);

  const baseClass = "flex justify-between items-center px-2 py-1.5 rounded-sm cursor-pointer text-xs font-medium transition group w-full text-left select-none relative";
  const variantClass = variant === 'danger' 
    ? "hover:bg-red-500 text-red-400 hover:text-white" 
    : "hover:bg-indigo-500 text-zinc-300 hover:text-white";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

  // Logic for submenu positioning (naive)
  const subMenuPosition = itemRef.current ? { top: 0, left: '100%' } : {};

  return (
    <div
        className="relative"
        onMouseEnter={() => children && setIsSubMenuOpen(true)}
        onMouseLeave={() => children && setIsSubMenuOpen(false)}
    >
        <button
            ref={itemRef}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClass} ${variantClass} ${disabledClass} ${isSubMenuOpen ? 'bg-indigo-500 text-white' : ''}`}
        >
          <span className="truncate flex-1">{label}</span>
          {children ? (
              <svg className="w-3 h-3 ml-2 fill-current" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5v10z"/></svg>
          ) : (
              icon && <span className="ml-2 opacity-70 group-hover:opacity-100">{icon}</span>
          )}
        </button>

        {children && isSubMenuOpen && (
             <div className="absolute left-full top-0 -ml-1 pl-2 w-48 z-50">
                 <div className="bg-[#111214] border border-zinc-900 rounded-md shadow-xl p-1.5 animate-in fade-in duration-75">
                     {children}
                 </div>
             </div>
        )}
    </div>
  );
}

// --- COMPOSANT SÉPARATEUR ---
export function ContextMenuSeparator() {
  return <div className="h-[1px] bg-zinc-700/30 my-1 mx-1"></div>;
}

// --- COMPOSANT LABEL (Pour les titres de section dans les sous-menus) ---
export function ContextMenuLabel({ label }: { label: string }) {
    return <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">{label}</div>
}
