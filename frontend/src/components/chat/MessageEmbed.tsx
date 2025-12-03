import React from 'react';

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface EmbedFooter {
  text: string;
  iconUrl?: string;
}

interface EmbedAuthor {
  name: string;
  url?: string;
  iconUrl?: string;
}

export interface EmbedProps {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  fields?: EmbedField[];
  footer?: EmbedFooter;
  image?: string;
  thumbnail?: string;
  author?: EmbedAuthor;
  timestamp?: string;
}

interface MessageEmbedProps {
  embed: EmbedProps;
  onImageClick?: (url: string) => void;
}

const MessageEmbed: React.FC<MessageEmbedProps> = ({ embed, onImageClick }) => {
  const colorHex = embed.color || '#202225';

  return (
    <div 
      className="flex flex-col max-w-[520px] rounded-[4px] bg-background-secondary border-l-4 mt-2 overflow-hidden shadow-sm"
      style={{ borderLeftColor: colorHex }}
    >
      <div className="p-4 grid gap-3">
        
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 grid gap-2">
            
            {/* Author */}
            {embed.author && (
              <div className="flex items-center gap-2 mb-1">
                {embed.author.iconUrl && (
                  <img src={embed.author.iconUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                )}
                {embed.author.url ? (
                  <a href={embed.author.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-text-normal hover:underline">
                    {embed.author.name}
                  </a>
                ) : (
                  <span className="text-sm font-bold text-text-normal">{embed.author.name}</span>
                )}
              </div>
            )}

            {/* Title */}
            {embed.title && (
              <div className="font-bold text-md text-text-normal leading-tight">
                {embed.url ? (
                  <a href={embed.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-brand">
                    {embed.title}
                  </a>
                ) : (
                  embed.title
                )}
              </div>
            )}

            {/* Description */}
            {embed.description && (
              <div className="text-sm text-text-normal whitespace-pre-wrap leading-relaxed opacity-90">
                {embed.description}
              </div>
            )}

            {/* Fields */}
            {embed.fields && embed.fields.length > 0 && (
              <div className="grid grid-cols-12 gap-3 mt-1">
                {embed.fields.map((field, i) => (
                  <div key={i} className={`${field.inline ? 'col-span-4' : 'col-span-12'}`}>
                    <div className="text-xs font-bold text-text-muted mb-1 uppercase tracking-wide">{field.name}</div>
                    <div className="text-sm text-text-normal whitespace-pre-wrap leading-snug">{field.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          {embed.thumbnail && (
            <div className="flex-shrink-0 pt-1">
              <img 
                src={embed.thumbnail} 
                alt="Thumbnail" 
                className="max-w-[80px] max-h-[80px] rounded-[4px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onImageClick?.(embed.thumbnail!)}
              />
            </div>
          )}
        </div>

        {/* Main Image */}
        {embed.image && (
          <div className="mt-1">
            <img 
              src={embed.image} 
              alt="Embed Image" 
              className="w-full rounded-[4px] object-cover max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick?.(embed.image!)}
            />
          </div>
        )}

        {/* Footer */}
        {(embed.footer || embed.timestamp) && (
          <div className="flex items-center gap-2 pt-2 text-xs font-medium text-text-muted mt-1">
            {embed.footer?.iconUrl && (
              <img src={embed.footer.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
            )}
            <span>
              {embed.footer?.text}
              {embed.footer && embed.timestamp && ' • '}
              {embed.timestamp && new Date(embed.timestamp).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageEmbed;
