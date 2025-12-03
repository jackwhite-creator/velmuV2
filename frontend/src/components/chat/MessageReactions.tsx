import React, { useMemo, useState } from 'react';
import { Reaction } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import Tooltip from '../ui/Tooltip';
import AnimatedCounter from '../ui/AnimatedCounter';

interface Props {
  reactions: Reaction[];
  onReactionClick: (emoji: string) => void;
}

export default function MessageReactions({ reactions, onReactionClick }: Props) {
  const { user } = useAuthStore();
  const [processingEmoji, setProcessingEmoji] = useState<string | null>(null);

  // Cache to store the first time we saw an emoji group
  const orderCache = React.useRef<Record<string, number>>({});

  const groupedReactions = useMemo(() => {
    if (!reactions || reactions.length === 0) return [];

    const groups = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          hasReacted: false,
          users: [],
          createdAt: reaction.createdAt
        };
      }
      acc[reaction.emoji].count++;
      if (reaction.user) {
          acc[reaction.emoji].users.push(reaction.user.username);
      } else {
          acc[reaction.emoji].users.push('Utilisateur inconnu');
      }
      if (user && reaction.userId === user.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      // We still track min createdAt for new groups
      if (new Date(reaction.createdAt) < new Date(acc[reaction.emoji].createdAt)) {
          acc[reaction.emoji].createdAt = reaction.createdAt;
      }
      return acc;
    }, {} as Record<string, { emoji: string; count: number; hasReacted: boolean; users: string[]; createdAt: string }>);

    // Update cache:
    // 1. If emoji is new to cache, add it with its current min createdAt
    // 2. If emoji is in cache, KEEP the cached value (this prevents jumping)
    // 3. We do NOT remove from cache immediately to ensure stability if it flickers, 
    //    but effectively we only care about keys present in 'groups'.
    Object.keys(groups).forEach(emoji => {
        if (!orderCache.current[emoji]) {
            orderCache.current[emoji] = new Date(groups[emoji].createdAt).getTime();
        }
    });

    // Cleanup cache for emojis that are no longer present
    Object.keys(orderCache.current).forEach(emoji => {
        if (!groups[emoji]) {
            delete orderCache.current[emoji];
        }
    });

    return Object.values(groups).sort((a, b) => {
        const timeA = orderCache.current[a.emoji] || new Date(a.createdAt).getTime();
        const timeB = orderCache.current[b.emoji] || new Date(b.createdAt).getTime();
        return timeA - timeB;
    });
  }, [reactions, user]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
        import('../../lib/emoji').then(({ parseEmoji }) => {
            parseEmoji(containerRef.current!);
        });
    }
  });

  if (!reactions || reactions.length === 0) return null;

  const handleReactionClick = async (emoji: string) => {
    if (processingEmoji === emoji) return; // Prevent spam
    setProcessingEmoji(emoji);
    try {
        await onReactionClick(emoji);
    } finally {
        // Add a small delay to prevent immediate re-click before server update
        setTimeout(() => setProcessingEmoji(null), 500);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-wrap gap-1.5 mt-1.5">
      {groupedReactions.map((group) => (
        <Tooltip 
            key={group.emoji} 
            text={
                group.users.length <= 3 
                ? group.users.join(', ') 
                : `${group.users.slice(0, 3).join(', ')} et ${group.users.length - 3} autres`
            } 
            side="top"
            keepOpenOnClick={true}
        >
            <button
            onClick={() => handleReactionClick(group.emoji)}
            disabled={processingEmoji === group.emoji}
            className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] border text-sm font-bold transition-all duration-200 select-none",
                group.hasReacted 
                ? "bg-brand-primary/15 border-brand-primary text-brand-primary hover:bg-brand-primary/25" 
                : "bg-background-secondary border-transparent hover:border-background-tertiary hover:bg-background-tertiary text-text-muted hover:text-text-normal",
                processingEmoji === group.emoji && "opacity-70"
            )}
            >
            <span className="text-base leading-none flex items-center">{group.emoji}</span>
            <AnimatedCounter 
                value={group.count} 
                className={cn("text-xs", group.hasReacted ? "text-brand-primary" : "text-text-muted")}
            />
            </button>
        </Tooltip>
      ))}
    </div>
  );
}
