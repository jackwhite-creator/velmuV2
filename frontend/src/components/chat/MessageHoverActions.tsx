import Tooltip from '../ui/Tooltip';

interface Props {
  isMe: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddReaction: (e: React.MouseEvent) => void;
}

const ActionButton = ({ 
  onClick, 
  icon, 
  label, 
  danger = false 
}: { 
  onClick: (e: React.MouseEvent) => void; 
  icon: React.ReactNode; 
  label: string; 
  danger?: boolean 
}) => (
  <Tooltip text={label} side="top">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`
        flex items-center justify-center w-8 h-8 rounded-sm transition-all duration-100
        ${danger 
          ? 'text-status-danger hover:bg-status-danger hover:text-white' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-modifier-selected'
        }
      `}
    >
      {icon}
    </button>
  </Tooltip>
);

export default function MessageHoverActions({ isMe, onReply, onEdit, onDelete, onAddReaction }: Props) {
  return (
    // ✅ CORRECTION : Ajout de 'opacity-0 group-hover:opacity-100' pour cacher par défaut
    // Le parent (MessageItem) a la classe 'group', donc ça s'affichera au survol du message
    <div className="absolute -top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      
      {/* CONTENEUR : Fond Zinc #2b2d31 + Bordure sombre #1e1f22 + Shadow */}
      <div className="flex items-center bg-secondary border border-tertiary rounded-sm shadow-sm p-[1px] select-none">
        
        <ActionButton 
          label="Ajouter une réaction" 
          onClick={onAddReaction} 
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11v1a10 10 0 1 1-9-10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M16 5h6"/><path d="M19 2v6"/></svg>} 
        />

        <ActionButton 
          label="Répondre" 
          onClick={onReply} 
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>} 
        />

        {isMe && (
          <ActionButton 
            label="Modifier" 
            onClick={onEdit} 
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>} 
          />
        )}

        {isMe && (
          <ActionButton 
            label="Supprimer" 
            onClick={onDelete} 
            danger 
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>} 
          />
        )}
        
      </div>
    </div>
  );
}