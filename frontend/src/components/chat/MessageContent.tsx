import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { formatDiscordDate } from '../../lib/dateUtils';
// ✅ IMPORT DU TOOLTIP
import Tooltip from '../ui/Tooltip';

interface Props {
  msg: any;
  shouldGroup: boolean;
  isEditing: boolean;
  editContent: string;
  isMentioningMe: boolean;
  isModified: boolean;
  onUserClick: (e: React.MouseEvent) => void;
  setEditContent: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onImageClick: (url: string) => void;
  onImageLoad: () => void;
}

export default function MessageContent({ 
  msg, shouldGroup, isEditing, editContent, isMentioningMe, isModified,
  onUserClick, setEditContent, onSaveEdit, onCancelEdit, onImageClick,
  onImageLoad 
}: Props) {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    ? msg.content.replace(/\n(?=\n)/g, '\n\u200B') 
    : '';

  return (
    <div className="flex-1 min-w-0 z-10 relative pr-2">
      {/* Header: username + date */}
      {!shouldGroup && (
        <div className="flex items-baseline gap-2 mb-0.5 select-none">
          <span className="font-medium text-indigo-100 hover:underline cursor-pointer" onClick={onUserClick}>
            {msg.user.username}
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">
            {formatDiscordDate(msg.createdAt)}
          </span>
        </div>
      )}

      {/* Contenu */}
      {isEditing ? (
        <div className="w-full mt-1">
          <div className="bg-[#2b2d31] p-2.5 rounded-sm w-full">
            <textarea 
              ref={textareaRef}
              autoFocus
              rows={1}
              className="w-full bg-[#383a40] text-zinc-200 p-3 rounded-[3px] outline-none border-none resize-none font-normal text-[15px] leading-relaxed custom-scrollbar overflow-hidden"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
            />
            
            <div className="text-[11px] mt-2 flex justify-between items-center select-none font-medium">
                <div className="flex gap-1 text-zinc-400">
                    <span className="hidden sm:inline">échap pour</span> 
                    <span className="text-brand hover:underline cursor-pointer" onClick={onCancelEdit}>annuler</span> 
                    <span className="mx-1">•</span> 
                    <span className="hidden sm:inline">entrée pour</span> 
                    <span className="text-brand hover:underline cursor-pointer" onClick={onSaveEdit}>enregistrer</span>
                </div>
                <span className={`${editContent.length >= 2000 ? 'text-status-danger font-bold' : 'text-zinc-500'}`}>
                    {editContent.length}/2000
                </span>
            </div>
          </div>
        </div>
      ) : (
        // Mode Lecture
        <div className={`leading-relaxed break-words -mt-1 select-text cursor-default ${isMentioningMe ? 'text-zinc-100' : 'text-zinc-300'}`}>
          
          {/* ✅ CONTENEUR FLEX-WRAP : Permet d'aligner le texte et le "(modifié)" sur la même ligne */}
          <div className="flex flex-wrap items-baseline gap-x-1">
              
              {msg.content && (
                <div className="markdown-body text-[15px]">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                            a: ({node, ...props}) => (
                                <a target="_blank" rel="noopener noreferrer" className="text-brand hover:underline cursor-pointer cursor-text" {...props} />
                            ),
                            p: ({node, ...props}) => (
                                // `inline` ou `inline-block` ici pourrait casser le markdown multi-paragraphe.
                                // On garde un block standard, le flex-wrap du parent gérera le positionnement global.
                                <div className="mb-1 last:mb-0 min-h-[1.25rem] cursor-text w-fit max-w-full" {...props} />
                            ),
                            ul: ({node, ...props}) => (
                                <ul className="list-disc list-inside ml-1 mb-1 cursor-text w-fit max-w-full" {...props} />
                            ),
                            ol: ({node, ...props}) => (
                                <ol className="list-decimal list-inside ml-1 mb-1 cursor-text w-fit max-w-full" {...props} />
                            ),
                            blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-[4px] border-zinc-600 pl-3 py-0.5 text-zinc-400 my-1 cursor-text w-fit max-w-full bg-[#2b2d31]/30 rounded-r-sm" {...props} />
                            ),
                            code({node, inline, className, children, ...props}: any) {
                                return inline ? (
                                    <code className="bg-[#2b2d31] px-1.5 py-0.5 rounded-[3px] text-[85%] font-mono text-zinc-200 cursor-text" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <div className="my-2 bg-[#2b2d31] rounded-[4px] border border-[#1e1f22] overflow-hidden cursor-text w-fit max-w-full">
                                        <pre className="p-3 overflow-x-auto custom-scrollbar font-mono text-sm text-zinc-300">
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
              
              {/* ✅ LE TAG "(modifié)" : Aligné, petit, avec Tooltip custom */}
              {isModified && (
                  <Tooltip text={new Date(msg.updatedAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })} side="top">
                    <span className="text-[10px] text-zinc-500 select-none cursor-default hover:text-zinc-400 transition-colors self-end pb-[2px]">
                        (modifié)
                    </span>
                  </Tooltip>
              )}

          </div>
          
          {/* IMAGE */}
          {msg.fileUrl && (
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