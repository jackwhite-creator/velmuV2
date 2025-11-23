import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { formatDiscordDate } from '../../lib/dateUtils';

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
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const processedContent = msg.content 
    ? msg.content.replace(/\n(?=\n)/g, '\n\u200B') 
    : '';

  return (
    <div className="flex-1 min-w-0 z-10 relative">
      {/* Header: username + date */}
      {!shouldGroup && (
        <div className="flex items-baseline gap-2 mb-0.5 select-none">
          <span className="font-medium text-indigo-100 hover:underline cursor-pointer" onClick={onUserClick}>
            {msg.user.username}
          </span>
          <span className="text-[11px] text-slate-500">
            {formatDiscordDate(msg.createdAt)}
          </span>
        </div>
      )}

      {/* Contenu */}
      {isEditing ? (
        <div className="bg-slate-900 p-2 rounded w-full mt-1 shadow-inner border border-slate-700/50">
          <input 
            autoFocus
            className="w-full bg-slate-800 text-slate-200 p-2 rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
          />
          <div className="text-xs mt-2 flex justify-between items-center select-none">
            <div className="flex gap-2">
                <span className="text-slate-400">Entrée pour <span className="text-indigo-400 cursor-pointer hover:underline" onClick={onSaveEdit}>sauvegarder</span></span>
                <span className="text-slate-400">• Echap pour <span className="text-red-400 cursor-pointer hover:underline" onClick={onCancelEdit}>annuler</span></span>
            </div>
            <span className={`text-[10px] ${editContent.length >= 2000 ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                {editContent.length}/2000
            </span>
          </div>
        </div>
      ) : (
        // 1. Conteneur Global : cursor-default pour que le vide ne déclenche pas le curseur texte
        <div className={`leading-relaxed break-words -mt-1 select-text cursor-default ${isMentioningMe ? 'text-slate-100' : 'text-slate-300'}`}>
          
          {msg.content && (
            <div className="markdown-body">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                        a: ({node, ...props}) => (
                            <a target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline cursor-pointer cursor-text" {...props} />
                        ),
                        // ✅ UX FIX : w-fit + max-w-full
                        // Cela force chaque paragraphe à ne prendre QUE la largeur du texte.
                        // Le vide à droite appartiendra donc au parent (qui est cursor-default).
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
                            <blockquote className="border-l-4 border-slate-600 pl-2 italic text-slate-400 my-1 cursor-text w-fit max-w-full" {...props} />
                        ),
                        code({node, inline, className, children, ...props}: any) {
                            return inline ? (
                                <code className="bg-[#2B2D31] px-1.5 py-0.5 rounded text-[85%] font-mono text-slate-200 cursor-text" {...props}>
                                    {children}
                                </code>
                            ) : (
                                // Pour les blocs de code, on garde w-full souvent c'est plus joli, 
                                // mais on peut mettre w-fit si tu préfères. Ici je laisse w-fit pour être cohérent.
                                <div className="my-2 bg-[#2B2D31] rounded-md border border-slate-950 overflow-hidden cursor-text w-fit max-w-full">
                                    <pre className="p-3 overflow-x-auto custom-scrollbar font-mono text-sm text-slate-200">
                                        <code {...props}>{children}</code>
                                    </pre>
                                </div>
                            );
                        }
                    }}
                >
                    {processedContent}
                </ReactMarkdown>
                
                {isModified && (
                    <span className="text-[10px] text-slate-500 ml-1 select-none inline-block cursor-default" title={`Modifié le ${new Date(msg.updatedAt).toLocaleString()}`}>
                        (modifié)
                    </span>
                )}
            </div>
          )}
          
          {/* IMAGE */}
          {msg.fileUrl && (
            <div className="mt-2 group/image select-none cursor-default"> 
              <img 
                src={msg.fileUrl} 
                alt="Attachment" 
                onLoad={onImageLoad}
                className="max-w-full md:max-w-sm max-h-[350px] rounded-lg shadow-sm border border-slate-700/50 cursor-pointer hover:shadow-md transition"
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