import React, { useEffect, useRef } from 'react';
import EmojiPicker from './EmojiPicker';

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function ReactionPicker({ onSelect, onClose, position }: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to not overflow screen (basic logic)
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(position.top, window.innerHeight - 450), // 450 is approx height of picker
    left: Math.min(position.left, window.innerWidth - 350), // 350 is approx width
    zIndex: 9999, // High z-index to be on top of everything
  };



  return (
    <div ref={pickerRef} style={style}>
      <EmojiPicker 
        onSelect={(emoji) => {
            onSelect(emoji);
            onClose();
        }} 
        onClose={onClose}
      />
    </div>
  );
}
