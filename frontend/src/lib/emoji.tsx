import twemoji from 'twemoji';
import React from 'react';

export const parseEmoji = (text: string | HTMLElement) => {
  return twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg',
    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
    className: 'emoji', // default class
    attributes: () => ({
        style: 'width: 1.2em; height: 1.2em; vertical-align: -0.2em; display: inline-block; margin: 0 0.1em;'
    })
  });
};

export const renderTwemoji = (text: string): React.ReactNode[] => {
    const html = parseEmoji(text) as string;
    // Split by img tags: <img ... >
    // Regex captures the whole tag.
    const parts = html.split(/(<img class="emoji"[^>]*>)/g);
    
    return parts.map((part, index) => {
        if (part.startsWith('<img class="emoji"')) {
            // Extract src and alt
            const srcMatch = part.match(/src="([^"]+)"/);
            const altMatch = part.match(/alt="([^"]+)"/);
            const src = srcMatch ? srcMatch[1] : '';
            const alt = altMatch ? altMatch[1] : '';
            
            return (
                <img 
                    key={index}
                    src={src} 
                    alt={alt} 
                    className="emoji" 
                    draggable={false}
                    style={{ 
                        width: '1.2em', 
                        height: '1.2em', 
                        verticalAlign: '-0.2em', 
                        display: 'inline-block', 
                        margin: '0 0.1em' 
                    }} 
                />
            );
        }
        // Return text part
        // Note: twemoji.parse might return HTML entities, but usually it preserves text.
        // We render as string, so React escapes it.
        return part;
    });
};

export const getEmojiUrl = (emoji: string): string => {
    const codePoints = [...emoji]
        .map(c => c.codePointAt(0)!)
        .filter(c => c !== 0xfe0f) // Remove VS16
        .map(c => c.toString(16));
        
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints.join('-')}.svg`;
};
