import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// --- TYPES ---

export interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  children?: React.ReactNode;
  items?: ContextMenuItemData[]; // New Data-Driven Prop
}

export type ContextMenuItemData =
  | { type: 'item'; label: string; icon?: React.ReactNode; onClick?: (e?: React.MouseEvent) => void; variant?: 'default' | 'danger'; disabled?: boolean; children?: ContextMenuItemData[] }
  | { type: 'separator' }
  | { type: 'label'; label: string };

interface ContextMenuItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
  children?: React.ReactNode; // For nested menus
  disabled?: boolean;
}

// --- COMPOSANT CONTENEUR ---
export function ContextMenu({ position, onClose, children, items }: ContextMenuProps) {
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

  const renderItems = (itemsToRender: ContextMenuItemData[]) => {
      return itemsToRender.map((item, index) => {
          if (item.type === 'separator') return <ContextMenuSeparator key={index} />;
          if (item.type === 'label') return <ContextMenuLabel key={index} label={item.label} />;
          if (item.type === 'item') {
              return (
                  <ContextMenuItem
                      key={index}
                      label={item.label}
                      icon={item.icon}
                      onClick={item.onClick}
                      variant={item.variant}
                      disabled={item.disabled}
                  >
                      {item.children && renderItems(item.children)}
                  </ContextMenuItem>
              );
          }
          return null;
      });
  };

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-transparent cursor-default"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
      />
      <div 
        ref={menuRef}
        className="fixed z-[9999] bg-background-floating border border-background-tertiary rounded-md shadow-xl p-1.5 min-w-[188px] animate-in fade-in duration-75 zoom-in-95 text-text-normal"
        style={style}
        onClick={(e) => e.stopPropagation()} 
        onContextMenu={(e) => e.preventDefault()} 
      >
        {items ? renderItems(items) : children}
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
    ? "hover:bg-status-danger text-status-danger hover:text-white" 
    : "hover:bg-brand text-text-normal hover:text-white";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

  return (
    <div 
        className="relative"
        onMouseEnter={() => children && setIsSubMenuOpen(true)}
        onMouseLeave={() => children && setIsSubMenuOpen(false)}
    >
        <button 
            ref={itemRef}
            onClick={(e) => { onClick?.(e); }}
            disabled={disabled}
            className={`${baseClass} ${variantClass} ${disabledClass} ${isSubMenuOpen ? 'bg-brand text-white' : ''}`}
        >
          <span className="truncate flex-1">{label}</span>
          {children ? (
              <svg className="w-3 h-3 ml-2 fill-current" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5v10z"/></svg>
          ) : (
              icon && <span className="ml-2 opacity-70 group-hover:opacity-100">{icon}</span>
          )}
        </button>

        {children && isSubMenuOpen && (
             <div 
                className={`absolute top-0 -ml-1 w-48 z-50 ${
                    // Simple check: if parent is close to right edge, show on left
                    // Since we don't have easy access to parent rect here without ref measurement on hover,
                    // we can use a CSS class or a more robust portal approach.
                    // For now, let's try a CSS-only approach using group-hover or just assume right unless specified.
                    // Better: Use a ref to measure position when opening.
                    'left-full pl-2' 
                }`}
                ref={(el) => {
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (rect.right > window.innerWidth) {
                            el.classList.remove('left-full', 'pl-2');
                            el.classList.add('right-full', 'pr-2');
                        }
                    }
                }}
             >
                 <div className="bg-background-floating border border-background-tertiary rounded-md shadow-xl p-1.5 animate-in fade-in duration-75">
                     {children}
                 </div>
             </div>
        )}
    </div>
  );
}

// --- COMPOSANT SÉPARATEUR ---
export function ContextMenuSeparator() {
  return <div className="h-[1px] bg-background-modifier-accent my-1 mx-1"></div>;
}

// --- COMPOSANT LABEL (Pour les titres de section dans les sous-menus) ---
export function ContextMenuLabel({ label }: { label: string }) {
    return <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">{label}</div>
}
