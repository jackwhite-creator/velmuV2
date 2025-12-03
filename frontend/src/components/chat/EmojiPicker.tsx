import React, { useState, useEffect, useRef, useMemo } from 'react';
import data from '@emoji-mart/data';

const emojiData = data as any;
import { Search, Smile, Leaf, Utensils, Activity, MapPin, Lightbulb, Hash, Flag, Clock } from 'lucide-react';
import { getEmojiUrl } from '../../lib/emoji';

interface Props {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { id: 'people', icon: Smile, label: 'Smileys & People' },
  { id: 'nature', icon: Leaf, label: 'Animals & Nature' },
  { id: 'foods', icon: Utensils, label: 'Food & Drink' },
  { id: 'activity', icon: Activity, label: 'Activity' },
  { id: 'places', icon: MapPin, label: 'Travel & Places' },
  { id: 'objects', icon: Lightbulb, label: 'Objects' },
  { id: 'symbols', icon: Hash, label: 'Symbols' },
  { id: 'flags', icon: Flag, label: 'Flags' },
];

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('people');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(50);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recents from local storage
  useEffect(() => {
    const saved = localStorage.getItem('velmu_recent_emojis');
    if (saved) {
        try {
            setRecentEmojis(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse recent emojis", e);
        }
    }
  }, []);

  // Progressive loading effect
  useEffect(() => {
    setVisibleCount(50);
    const timer = setTimeout(() => {
        setVisibleCount(500); // Load more after a short delay
    }, 50);
    return () => clearTimeout(timer);
  }, [activeCategory, search]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    
    // Update recents
    const newRecents = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecents);
    localStorage.setItem('velmu_recent_emojis', JSON.stringify(newRecents));
  };

  const filteredEmojis = useMemo(() => {
    if (!search) return null;
    
    const query = search.toLowerCase();
    const results: any[] = [];
    
    // Search across all categories
    for (const cat of emojiData.categories) {
        for (const emojiId of cat.emojis) {
            const emoji = emojiData.emojis[emojiId];
            if (emoji.name.toLowerCase().includes(query) || emoji.keywords?.some((k: string) => k.includes(query))) {
                results.push(emoji.skins[0].native);
            }
            if (results.length > 100) break; // Limit search results for performance
        }
        if (results.length > 100) break;
    }
    return results;
  }, [search]);

  const categoryEmojis = useMemo(() => {
    const map: {[key: string]: string[]} = {};
    
    for (const cat of emojiData.categories) {
        map[cat.id] = cat.emojis.map((id: string) => emojiData.emojis[id].skins[0].native);
    }
    return map;
  }, []);

  const renderEmojiButton = (emoji: string, idx: number) => (
    <button
        key={idx}
        onClick={() => handleEmojiClick(emoji)}
        className="w-9 h-9 flex items-center justify-center rounded hover:bg-background-tertiary transition-colors"
    >
        <img 
            src={getEmojiUrl(emoji)} 
            alt={emoji}
            className="w-6 h-6 pointer-events-none select-none"
            loading="lazy"
            draggable={false}
        />
    </button>
  );

  return (
    <div className="w-[350px] h-[450px] bg-background-secondary rounded-lg shadow-2xl border border-background-tertiary flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-3 border-b border-background-tertiary bg-background-secondary z-10 space-y-2">
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher un émoji"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background-tertiary text-text-normal text-sm rounded px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-brand placeholder-text-muted transition-all"
                autoFocus
            />
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
        </div>
        
        {/* Category Tabs */}
        {!search && (
            <div className="flex justify-between px-1 overflow-x-auto custom-scrollbar pb-1 gap-1">
                <button 
                    onClick={() => setActiveCategory('recent')}
                    className={`p-1.5 rounded hover:bg-background-tertiary transition-colors ${activeCategory === 'recent' ? 'text-brand bg-background-tertiary' : 'text-text-muted'}`}
                    title="Récents"
                >
                    <Clock className="w-5 h-5" />
                </button>
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`p-1.5 rounded hover:bg-background-tertiary transition-colors ${activeCategory === cat.id ? 'text-brand bg-background-tertiary' : 'text-text-muted'}`}
                            title={cat.label}
                        >
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-background-primary">
        {search ? (
            <div className="grid grid-cols-8 gap-1">
                {filteredEmojis && filteredEmojis.length > 0 ? (
                    filteredEmojis.slice(0, visibleCount).map((emoji, idx) => renderEmojiButton(emoji, idx))
                ) : (
                    <div className="col-span-8 text-center py-8 text-text-muted text-sm">
                        Aucun émoji trouvé
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-4">
                {activeCategory === 'recent' ? (
                    <div id="emoji-category-recent">
                        <div className="text-xs font-bold text-text-muted uppercase mb-2 px-2">Récents</div>
                        {recentEmojis.length > 0 ? (
                            <div className="grid grid-cols-8 gap-1">
                                {recentEmojis.map((emoji, idx) => renderEmojiButton(emoji, idx))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-muted text-sm italic">
                                Pas d'émojis récents
                            </div>
                        )}
                    </div>
                ) : (
                    <div id={`emoji-category-${activeCategory}`}>
                        <div className="text-xs font-bold text-text-muted uppercase mb-2 px-2 sticky top-0 bg-background-primary/95 backdrop-blur-sm py-1 z-10">
                            {CATEGORIES.find(c => c.id === activeCategory)?.label}
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                            {categoryEmojis[activeCategory]?.slice(0, visibleCount).map((emoji, idx) => renderEmojiButton(emoji, idx))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
