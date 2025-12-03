import React, { useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useServerStore } from '../../store/serverStore';
import { Permissions } from '../../../../backend/src/shared/permissions';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';
import { Message } from '../../hooks/useChat';
import { formatDiscordDate } from '../../lib/dateUtils';

import MessageReplyHeader from './MessageReplyHeader';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageHoverActions from './MessageHoverActions';
import UserContextMenuContent from './UserContextMenuContent';
import MessageReactions from './MessageReactions';
import ReactionPicker from './ReactionPicker';
import MessageEmbed from './MessageEmbed';

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
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction: (messageId: string, emoji: string) => Promise<void>;
}

const Icons = {
  Reply: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>,
  Copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Kick: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
};

function MessageItem({ 
  msg, isMe, shouldGroup, onReply, onDelete, onUserClick, onReplyClick,
  isOwner, serverId, onImageClick, onImageLoad,
  onAddReaction, onRemoveReaction
}: Props) {
  const { user: currentUser } = useAuthStore();
  const { activeServer } = useServerStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  const isModified = msg.updatedAt && (new Date(msg.updatedAt).getTime() - new Date(msg.createdAt).getTime() > 2000);

  // Check permissions for @everyone if message is pending
  const canMentionEveryone = React.useMemo(() => {
    if (!activeServer || !currentUser) return false;
    if (activeServer.ownerId === currentUser.id) return true;
    
    const member = activeServer.members?.find(m => m.userId === currentUser.id);
    if (!member) return false;

    return member.roles?.some(memberRole => {
      const serverRole = activeServer.roles?.find((r: any) => r.id === memberRole.id);
      return serverRole?.permissions?.includes(Permissions.ADMINISTRATOR) || 
             serverRole?.permissions?.includes(Permissions.MENTION_EVERYONE);
    }) || false;
  }, [activeServer, currentUser]);

  const isMentioningMe = (msg.replyTo?.user?.id === currentUser?.id) || 
    (currentUser?.id && msg.content?.includes(`<@${currentUser.id}>`)) || 
    (msg.content?.includes('@everyone') && (!msg.isPending || canMentionEveryone));

  const marginTopClass = shouldGroup 
    ? (isMentioningMe ? 'mt-0 pt-[2px]' : 'mt-[2px]') 
    : 'mt-[17px]';
  
  const backgroundClass = isMentioningMe 
    ? 'bg-[rgba(240,178,50,0.1)] hover:bg-[rgba(240,178,50,0.15)] before:bg-status-warning' 
    : 'hover:bg-background-modifier-hover transparent';

  // ✅ STYLE OPACITÉ SI PENDING
  const pendingClass = msg.isPending ? 'opacity-60' : 'opacity-100';

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
    if (msg.isPending) return; // Pas de clic droit si pas encore envoyé
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleReactionClick = async (emoji: string) => {
      const hasReacted = msg.reactions?.some(r => r.emoji === emoji && r.userId === currentUser?.id);
      if (hasReacted) {
          await onRemoveReaction(msg.id, emoji);
      } else {
          await onAddReaction(msg.id, emoji);
      }
  };

  const handleOpenReactionPicker = (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setPickerPosition({ top: rect.top - 460, left: rect.left }); // Position above
      setShowReactionPicker(true);
  };

  return (
    <>
      <div 
        id={`message-${msg.id}`} 
        onContextMenu={handleContextMenu}
        className={`
          group relative pr-4 pl-4 py-0.5 transition-colors w-full
          ${marginTopClass} ${backgroundClass} ${pendingClass}
          ${isMentioningMe ? 'before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]' : ''}
        `}
      >
        {msg.type === 'SYSTEM' ? (
            <div className="flex gap-4 w-full mt-[17px] py-1 group-hover:opacity-100 opacity-80 transition-opacity">
                <div className="w-10 flex-shrink-0 flex items-center justify-center">
                    <div className="text-brand">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-text-muted text-base font-medium">
                    <span>
                        <span className="font-bold text-text-normal cursor-pointer hover:underline" onClick={(e) => onUserClick(e, msg.user.id)}>
                            {msg.content}
                        </span> 
                        <span> est arrivé !</span>
                    </span>
                    <span className="text-[11px] text-text-muted font-medium ml-1">
                        {formatDiscordDate(msg.createdAt)}
                    </span>
                </div>
            </div>
        ) : (
        <>
        {msg.replyTo && !shouldGroup && (
          <MessageReplyHeader replyTo={msg.replyTo} onClick={() => onReplyClick(msg.replyTo!.id)} />
        )}

        <div className="flex gap-4 w-full">
          <MessageAvatar 
            user={msg.user} 
            createdAt={msg.createdAt} 
            shouldGroup={shouldGroup} 
            onClick={(e) => onUserClick(e, msg.user.id)} 
          />

          <div className="flex-1 min-w-0 w-full">
            <MessageContent 
                msg={msg}
                shouldGroup={shouldGroup}
                isEditing={isEditing}
                editContent={editContent}
                isMentioningMe={isMentioningMe || false}
                isModified={isModified || false}
                onUserClick={(e) => onUserClick(e, msg.user.id)}
                onMentionClick={onUserClick}
                setEditContent={setEditContent}
                onSaveEdit={saveEdit}
                onCancelEdit={() => { setIsEditing(false); setEditContent(msg.content); }}
                onImageClick={onImageClick}
                onImageLoad={onImageLoad}
                canMentionEveryone={canMentionEveryone}
            />

            {msg.embed && <MessageEmbed embed={msg.embed} onImageClick={onImageClick} />}
            
            <MessageReactions 
                reactions={msg.reactions || []} 
                onReactionClick={handleReactionClick} 
            />

          </div>
        </div>
        
        {/* Pas d'actions si le message est en cours d'envoi */}
        {!isEditing && !msg.isPending && (
          <MessageHoverActions 
            isMe={isMe}
            onReply={() => onReply(msg)}
            onEdit={() => { setIsEditing(true); setEditContent(msg.content); }}
            onDelete={() => onDelete(msg.id)}
            onAddReaction={handleOpenReactionPicker}
          />
        )}
        </>
        )}
      </div>

      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
          <ContextMenuItem label="Ajouter une réaction" onClick={(e) => { handleOpenReactionPicker(e); setContextMenu(null); }} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11v1a10 10 0 1 1-9-10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M16 5h6"/><path d="M19 2v6"/></svg>} />
          <ContextMenuSeparator />
          <ContextMenuItem label="Répondre" onClick={() => { onReply(msg); setContextMenu(null); }} icon={Icons.Reply} />
          <ContextMenuItem label="Copier le texte" onClick={() => { navigator.clipboard.writeText(msg.content); setContextMenu(null); }} icon={Icons.Copy} />
          
          {isMe && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem label="Modifier" onClick={() => { setIsEditing(true); setEditContent(msg.content); setContextMenu(null); }} icon={Icons.Edit} />
              <ContextMenuItem label="Supprimer" onClick={() => { onDelete(msg.id); setContextMenu(null); }} variant="danger" icon={Icons.Trash} />
            </>
          )}

          {/* User Management Actions */}
          {!isMe && (
              <>
                <ContextMenuSeparator />
                <UserContextMenuContent memberId={msg.user.id} serverId={serverId} onClose={() => setContextMenu(null)} />
              </>
          )}
        </ContextMenu>
      )}

      {showReactionPicker && (
          <ReactionPicker 
            onSelect={(emoji) => {
                onAddReaction(msg.id, emoji);
                setShowReactionPicker(false);
            }}
            onClose={() => setShowReactionPicker(false)}
            position={pickerPosition}
          />
      )}
    </>
  );
}

export default React.memo(MessageItem);