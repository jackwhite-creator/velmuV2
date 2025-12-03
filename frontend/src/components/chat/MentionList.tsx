import React, { useEffect, useRef } from 'react';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
}

interface Props {
  users: User[];
  selectedIndex: number;
  onSelect: (user: User) => void;
  onClose: () => void;
  position: { bottom: number | string; left: number | string };
}

export default function MentionList({ users, selectedIndex, onSelect, onClose, position }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (users.length === 0) return null;

  return (
    <div 
      ref={listRef}
      className="absolute z-50 bg-background-secondary border border-background-tertiary rounded-md shadow-lg w-64 max-h-60 overflow-y-auto custom-scrollbar flex flex-col p-1"
      style={{ bottom: position.bottom, left: position.left }}
    >
      <div className="px-2 py-1 text-xs font-bold text-text-muted uppercase tracking-wide mb-1">
        Membres
      </div>
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-sm w-full text-left transition-colors ${
            index === selectedIndex 
              ? 'bg-brand text-white' 
              : 'text-text-normal hover:bg-background-modifier-hover'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-background-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold">{user.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex items-center min-w-0 gap-1">
            <span className="font-medium truncate text-sm">
              {user.username}
            </span>
            <span className={`text-xs ${index === selectedIndex ? 'text-zinc-200' : 'text-text-muted'}`}>
              #{user.discriminator}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
