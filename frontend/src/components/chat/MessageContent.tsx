import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { formatDiscordDate } from '../../lib/dateUtils';
import Tooltip from '../ui/Tooltip';
import { useServerStore, Member } from '../../store/serverStore';
import { processMentionsForFrontend } from '../../lib/mentionUtils';
import InviteEmbed from './InviteEmbed';

interface Props {
  msg: any;
  shouldGroup: boolean;
  isEditing: boolean;
  editContent: string;
  isMentioningMe: boolean;
  isModified: boolean;
  onUserClick: (e: React.MouseEvent) => void;
  onMentionClick: (e: React.MouseEvent, userId: string) => void;
  setEditContent: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onImageClick: (url: string) => void;
  onImageLoad: () => void;
  canMentionEveryone?: boolean;
}

export default function MessageContent({ 
  msg, shouldGroup, isEditing, editContent, isMentioningMe, isModified,
  onUserClick, onMentionClick, setEditContent, onSaveEdit, onCancelEdit, onImageClick,
  onImageLoad, canMentionEveryone = true
}: Props) {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeServer, activeConversation, getMemberColor } = useServerStore();

  // Extract invite code
  const inviteCodeMatch = msg.content?.match(/(?:https?:\/\/)?(?:localhost:\d+|velmu\.com)\/invite\/([a-zA-Z0-9]+)/);
  const inviteCode = inviteCodeMatch ? inviteCodeMatch[1] : null;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing, editContent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const processedContent = msg.content 
    ? processMentionsForFrontend(
        msg.content, 
        activeConversation, 
        activeServer,
        !msg.isPending || canMentionEveryone
      ).replace(/\n(?=\n)/g, '\n\u200B') 
    : '';

  const member = activeServer?.members?.find(m => m.userId === msg.user.id);
  const usernameColor = member ? (getMemberColor(member) || 'var(--text-normal)') : 'var(--text-normal)';

  return (
    <div className="flex-1 min-w-0 z-10 relative pr-2">
      {!shouldGroup && (
        <div className="flex items-baseline gap-2 mb-0.5 select-none">
          <span 
            className="font-medium hover:underline cursor-pointer" 
            style={{ color: usernameColor }}
            onClick={onUserClick}
          >
            {msg.user.username}
          </span>
          <span className="text-[11px] text-text-muted font-medium">
            {formatDiscordDate(msg.createdAt)}
          </span>
        </div>
      )}

      {isEditing ? (
        <div className="w-full mt-1">
          <div className="bg-background-secondary p-2.5 rounded-sm w-full">
            <textarea 
              ref={textareaRef}
              autoFocus
              rows={1}
              className="w-full bg-background-tertiary text-text-normal p-3 rounded-[3px] outline-none border-none resize-none font-normal text-[15px] leading-relaxed custom-scrollbar overflow-hidden"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
            />
            
            <div className="text-[11px] mt-2 flex justify-between items-center select-none font-medium">
                <div className="flex gap-1 text-text-muted">
                    <span className="hidden sm:inline">échap pour</span> 
                    <span className="text-brand hover:underline cursor-pointer" onClick={onCancelEdit}>annuler</span> 
                    <span className="mx-1">•</span> 
                    <span className="hidden sm:inline">entrée pour</span> 
                    <span className="text-brand hover:underline cursor-pointer" onClick={onSaveEdit}>enregistrer</span>
                </div>
                <span className={`${editContent.length >= 2000 ? 'text-status-danger font-bold' : 'text-text-muted'}`}>
                    {editContent.length}/2000
                </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={`leading-relaxed break-words -mt-1 select-text cursor-default text-text-normal`}>
          
          <div className="flex flex-wrap items-baseline gap-x-1">
              {msg.content && (
                <div className="markdown-body text-[15px] break-all">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                            a: ({node, href, children, ...props}) => {
                                if (href?.startsWith('#mention-')) {
                                    const userId = href.replace('#mention-', '');
                                    
                                    if (userId === 'everyone') {
                                        return (
                                            <span 
                                                className="bg-[rgba(240,178,50,0.1)] text-[#f0b232] px-1 rounded-[3px] font-medium hover:bg-[rgba(240,178,50,0.2)] transition-colors select-none cursor-default"
                                            >
                                                {children}
                                            </span>
                                        );
                                    }

                                    return (
                                        <span 
                                            onClick={(e) => { 
                                                e.preventDefault();
                                                e.stopPropagation(); 
                                                onMentionClick(e, userId);
                                            }}
                                            className="bg-brand/10 text-brand px-1 rounded-[3px] font-medium cursor-pointer hover:bg-brand hover:text-white transition-colors select-none"
                                            data-user-id={userId}
                                        >
                                            {children}
                                        </span>
                                    );
                                }
                                return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline cursor-pointer cursor-text" {...props}>
                                        {children}
                                    </a>
                                );
                            },
                            p: ({node, ...props}) => (
                                <div className="mb-1 last:mb-0 min-h-[1.25rem] cursor-text w-fit max-w-full" {...props} />
                            ),
                            ul: ({node, ...props}) => (
                                <ul className="list-disc list-inside ml-1 mb-1 cursor-text w-fit max-w-full" {...props} />
                            ),
                            ol: ({node, ...props}) => (
                                <ol className="list-decimal list-inside ml-1 mb-1 cursor-text w-fit max-w-full" {...props} />
                            ),
                            blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-[4px] border-background-tertiary pl-3 py-0.5 text-text-muted my-1 cursor-text w-fit max-w-full bg-background-secondary/30 rounded-r-sm" {...props} />
                            ),
                            code({node, inline, className, children, ...props}: any) {
                                return inline ? (
                                    <code className="bg-background-secondary px-1.5 py-0.5 rounded-[3px] text-[85%] font-mono text-text-normal cursor-text" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <div className="my-2 bg-background-secondary rounded-[4px] border border-background-tertiary overflow-hidden cursor-text w-fit max-w-full">
                                        <pre className="p-3 overflow-x-auto custom-scrollbar font-mono text-sm text-text-normal">
                                            <code {...props}>{children}</code>
                                        </pre>
                                    </div>
                                );
                            }
                        }}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </div>
              )}
              
              {isModified && (
                  <Tooltip text={new Date(msg.updatedAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })} side="top">
                    <span className="text-[10px] text-text-muted select-none cursor-default hover:text-text-normal transition-colors self-end pb-[2px]">
                        (modifié)
                    </span>
                  </Tooltip>
              )}
          </div>

          {/* Invite Embed */}
          {inviteCode && (
            <InviteEmbed code={inviteCode} onLoad={onImageLoad} />
          )}
          
          {/* Attachments Rendering */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 select-none cursor-default">
              {msg.attachments.map((att: any, idx: number) => {
                const isImage = (att.type?.startsWith('image/')) || 
                                /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(att.filename) ||
                                /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(att.url);
                
                if (isImage) {
                  return (
                    <div key={idx} className="group/image">
                      <img 
                        src={att.url} 
                        alt={att.filename} 
                        onLoad={onImageLoad}
                        className="max-w-full md:max-w-sm max-h-[350px] rounded-[4px] shadow-sm cursor-pointer hover:shadow-md transition"
                        onClick={() => onImageClick(att.url)}
                        onError={(e) => console.error("Erreur chargement image", att.url)}
                      />
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex items-center gap-3 bg-background-secondary border border-background-tertiary p-3 rounded-[4px] max-w-sm hover:bg-background-tertiary transition-colors group">
                    <div className="text-brand">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-[#00a8fc] font-medium truncate group-hover:underline cursor-pointer">
                            <a href={att.url} target="_blank" rel="noopener noreferrer">{att.filename}</a>
                        </div>
                        <div className="text-xs text-text-muted">
                            {att.size ? `${(att.size / 1024).toFixed(2)} KB` : 'Fichier'}
                        </div>
                    </div>
                    <a href={att.url} download target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-normal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Legacy support for old messages with fileUrl */}
          {msg.fileUrl && !msg.attachments?.length && (
            <div className="mt-2 group/image select-none cursor-default"> 
              <img 
                src={msg.fileUrl} 
                alt="Attachment" 
                onLoad={onImageLoad}
                className="max-w-full md:max-w-sm max-h-[350px] rounded-[4px] shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => onImageClick(msg.fileUrl)}
                onError={(e) => console.error("Erreur chargement image", msg.fileUrl)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}