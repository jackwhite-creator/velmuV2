import React, { useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import ConfirmModal from '../ui/ConfirmModal';
import { Message } from '../../hooks/useChat';

// Sous-composants
import MessageReplyHeader from './MessageReplyHeader';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageHoverActions from './MessageHoverActions';

interface Props {
  msg: Message;
  isMe: boolean;
  isSameUser: boolean;
  shouldGroup: boolean;
  onReply: (msg: any) => void;
  onDelete: (id: string) => void;
  onUserClick: (e: React.MouseEvent, userId: string) => void;
  onReplyClick: (id: string) => void;
  isOwner?: boolean;
  serverId?: string;
  onImageClick: (url: string) => void;
  onImageLoad: () => void;
}

const Icons = {
  Reply: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>,
  Copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Kick: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
};

export default function MessageItem({ 
  msg, isMe, shouldGroup, onReply, onDelete, onUserClick, onReplyClick,
  isOwner, serverId, onImageClick, onImageLoad
}: Props) {
  const { user: currentUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);

  const isModified = msg.updatedAt && (new Date(msg.updatedAt).getTime() - new Date(msg.createdAt).getTime() > 2000);
  const isMentioningMe = msg.replyTo?.user?.id === currentUser?.id;

  const marginTopClass = shouldGroup ? 'mt-[2px]' : 'mt-[17px]';
  
  // ✅ CORRECTION ICI : On utilise des valeurs RGBA explicites pour garantir la transparence
  // bg-[rgba(240,178,50,0.1)] = Jaune avec 10% d'opacité (le fond)
  // before:bg-status-warning = La barre latérale utilise toujours la variable du thème (solide)
  const backgroundClass = isMentioningMe 
    ? 'bg-[rgba(240,178,50,0.1)] hover:bg-[rgba(240,178,50,0.15)] before:bg-status-warning' 
    : 'hover:bg-background-modifier-hover transparent';

  const saveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/messages/${msg.id}`, { content: editContent });
      setIsEditing(false);
    } catch (err) {
      console.error("Erreur edition", err);
      alert("Impossible de modifier le message");
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleKickAction = () => {
    setConfirmKickOpen(true);
    setContextMenu(null);
  };

  const performKick = async () => {
    if (!serverId) return;
    try {
      await api.delete(`/members/${serverId}/kick/${msg.user.id}`);
    } catch (e) { console.error(e); }
    setConfirmKickOpen(false);
  };

  return (
    <>
      <div 
        id={`message-${msg.id}`} 
        onContextMenu={handleContextMenu}
        className={`
          group relative pr-4 pl-4 py-0.5 transition-colors
          ${marginTopClass} ${backgroundClass}
          ${isMentioningMe ? 'before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]' : ''}
        `}
      >
        {msg.replyTo && !shouldGroup && (
          <MessageReplyHeader replyTo={msg.replyTo} onClick={() => onReplyClick(msg.replyTo.id)} />
        )}

        <div className="flex gap-4">
          <MessageAvatar 
            user={msg.user} 
            createdAt={msg.createdAt} 
            shouldGroup={shouldGroup} 
            onClick={(e) => onUserClick(e, msg.user.id)} 
          />

          <div className="flex-1 min-w-0">
            <MessageContent 
                msg={msg}
                shouldGroup={shouldGroup}
                isEditing={isEditing}
                editContent={editContent}
                isMentioningMe={isMentioningMe}
                isModified={isModified || false}
                onUserClick={(e) => onUserClick(e, msg.user.id)}
                setEditContent={setEditContent}
                onSaveEdit={saveEdit}
                onCancelEdit={() => { setIsEditing(false); setEditContent(msg.content); }}
                onImageClick={onImageClick}
                onImageLoad={onImageLoad}
            />

            {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((att) => (
                        <div key={att.id} className="relative group/img cursor-pointer">
                            {att.type === 'IMAGE' ? (
                                <img 
                                    src={att.url} 
                                    alt={att.filename} 
                                    onLoad={onImageLoad}
                                    onClick={() => onImageClick(att.url)}
                                    className="max-w-md max-h-80 rounded-md border border-background-secondary hover:border-brand/50 transition object-contain bg-background-tertiary"
                                />
                            ) : (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-background-secondary p-3 rounded-md border border-background-tertiary hover:bg-background-tertiary transition">
                                    <div className="text-brand">📄</div>
                                    <span className="text-sm text-text-normal underline">{att.filename}</span>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
        
        {!isEditing && (
          <MessageHoverActions 
            isMe={isMe}
            onReply={() => onReply(msg)}
            onEdit={() => { setIsEditing(true); setEditContent(msg.content); }}
            onDelete={() => onDelete(msg.id)}
          />
        )}
      </div>

      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
          <ContextMenuItem label="Répondre" onClick={() => { onReply(msg); setContextMenu(null); }} icon={Icons.Reply} />
          <ContextMenuItem label="Copier le texte" onClick={() => { navigator.clipboard.writeText(msg.content); setContextMenu(null); }} icon={Icons.Copy} />
          
          {isMe && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem label="Modifier" onClick={() => { setIsEditing(true); setEditContent(msg.content); setContextMenu(null); }} icon={Icons.Edit} />
              <ContextMenuItem label="Supprimer" onClick={() => { onDelete(msg.id); setContextMenu(null); }} variant="danger" icon={Icons.Trash} />
            </>
          )}

          {isOwner && !isMe && serverId && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem label="Exclure" variant="danger" onClick={handleKickAction} icon={Icons.Kick} />
            </>
          )}
        </ContextMenu>
      )}

      <ConfirmModal 
        isOpen={confirmKickOpen}
        onClose={() => setConfirmKickOpen(false)}
        onConfirm={performKick}
        title={`Exclure ${msg.user.username}`}
        message="Voulez-vous vraiment exclure cet utilisateur ?"
        isDestructive={true}
        confirmText="Exclure"
      />
    </>
  );
}