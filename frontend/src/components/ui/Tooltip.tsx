import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  side?: Side;
  delay?: number;
  keepOpenOnClick?: boolean;
}

const styles = `
  @keyframes tooltip-slide-right { from { opacity: 0; transform: translate(-5px, -50%) scale(0.95); } to { opacity: 1; transform: translate(0, -50%) scale(1); } }
  @keyframes tooltip-slide-left  { from { opacity: 0; transform: translate(5px, -50%) scale(0.95); } to { opacity: 1; transform: translate(-100%, -50%) scale(1); } }
  @keyframes tooltip-slide-top   { from { opacity: 0; transform: translate(-50%, calc(-100% + 5px)) scale(0.95); } to { opacity: 1; transform: translate(-50%, -100%) scale(1); } }
  @keyframes tooltip-slide-bottom{ from { opacity: 0; transform: translate(-50%, -5px) scale(0.95); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
`;

const PortalTooltip = ({ text, rect, side }: { text: string; rect: DOMRect; side: Side }) => {
  const gap = 8; 
  let top = 0;
  let left = 0;
  let animClass = '';
  let arrowClass = '';

  switch (side) {
    case 'right':
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
      animClass = 'animate-[tooltip-slide-right_0.15s_ease-out_forwards] origin-left';
      arrowClass = 'border-r-background-floating border-y-transparent border-l-0 border-y-[6px] border-r-[6px] -left-[6px] top-1/2 -translate-y-1/2';
      break;
    case 'left':
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
      animClass = 'animate-[tooltip-slide-left_0.15s_ease-out_forwards] origin-right';
      arrowClass = 'border-l-background-floating border-y-transparent border-r-0 border-y-[6px] border-l-[6px] -right-[6px] top-1/2 -translate-y-1/2';
      break;
    case 'top':
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
      animClass = 'animate-[tooltip-slide-top_0.15s_ease-out_forwards] origin-bottom';
      arrowClass = 'border-t-background-floating border-x-transparent border-b-0 border-x-[6px] border-t-[6px] -bottom-[6px] left-1/2 -translate-x-1/2';
      break;
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
      animClass = 'animate-[tooltip-slide-bottom_0.15s_ease-out_forwards] origin-top';
      arrowClass = 'border-b-background-floating border-x-transparent border-t-0 border-x-[6px] border-b-[6px] -top-[6px] left-1/2 -translate-x-1/2';
      break;
  }

  let transformStyle = '';
  if (side === 'left') transformStyle = 'translate(-100%, -50%)';
  else if (side === 'right') transformStyle = 'translate(0, -50%)';
  else if (side === 'top') transformStyle = 'translate(-50%, -100%)';
  else transformStyle = 'translate(-50%, 0)';

  const containerStyle: React.CSSProperties = {
    top: top,
    left: left,
    transform: transformStyle
  };

  return createPortal(
    <>
      <style>{styles}</style>
      <div 
        className={`fixed z-[9999] flex items-center justify-center pointer-events-none ${animClass}`}
        style={containerStyle}
      >
        <div className={`absolute w-0 h-0 ${arrowClass}`} />
        <div className="bg-background-floating text-text-normal border border-background-tertiary text-[12px] font-bold px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap">
          {text}
        </div>
      </div>
    </>,
    document.body
  );
};

export default function Tooltip({ children, text, side = 'top', delay = 0, keepOpenOnClick = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<DOMRect | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Si pas de texte, on rend juste l'enfant sans logique
  if (!text) return children;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    setCoords(target.getBoundingClientRect());
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // ✅ NOUVEAU : Fermer le tooltip au clic (sauf si keepOpenOnClick est true)
  const handleClick = (e: React.MouseEvent) => {
    if (!keepOpenOnClick) {
        setIsVisible(false);
    }
    // On préserve le onClick original de l'enfant s'il existe
    if (children.props.onClick) {
      children.props.onClick(e);
    }
  };

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClick: handleClick, // On injecte notre gestionnaire de clic
        onMouseDown: () => {
            if (!keepOpenOnClick) setIsVisible(false);
        }
      } as any)}
      {isVisible && coords && <PortalTooltip text={text} rect={coords} side={side} />}
    </>
  );
}