import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, ArrowLeft } from 'lucide-react';

interface Gif {
  id: string;
  media_formats: {
    tinygif: { url: string; dims: number[] };
    gif: { url: string; dims: number[] };
  };
  content_description: string;
}

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const TENOR_KEY = 'AIzaSyBqf6lLsJwGH7iTecupd93TtgeoJp2ldl8';
const CLIENT_KEY = 'Velmu';

const CATEGORIES = [
  { id: 'trending', label: 'tendances', query: '' },
  { id: 'reaction', label: 'réactions', query: 'reaction' },
  { id: 'anime', label: 'anime', query: 'anime' },
  { id: 'meme', label: 'memes', query: 'meme' },
  { id: 'cute', label: 'mignon', query: 'cute' },
  { id: 'gaming', label: 'gaming', query: 'gaming' },
  { id: 'funny', label: 'drôle', query: 'funny' },
  { id: 'sad', label: 'triste', query: 'sad' },
  { id: 'happy', label: 'content', query: 'happy' },
  { id: 'dance', label: 'danse', query: 'dance' },
  { id: 'yes', label: 'oui', query: 'yes' },
  { id: 'no', label: 'non', query: 'no' },
  { id: 'hello', label: 'bonjour', query: 'hello' },
  { id: 'bye', label: 'au revoir', query: 'bye' },
  { id: 'love', label: 'amour', query: 'love' },
  { id: 'excited', label: 'excité', query: 'excited' },
  { id: 'confused', label: 'confus', query: 'confused' },
  { id: 'angry', label: 'énervé', query: 'angry' },
  { id: 'shocked', label: 'choqué', query: 'shocked' },
  { id: 'applause', label: 'bravo', query: 'applause' },
  { id: 'sorry', label: 'désolé', query: 'sorry' },
];

export default function GifPicker({ onSelect, onClose }: Props) {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [nextPos, setNextPos] = useState('');
  const [debouncing, setDebouncing] = useState(false);
  const [categoryCovers, setCategoryCovers] = useState<{[key: string]: string}>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch category covers on mount
  useEffect(() => {
    const fetchCovers = async () => {
        const covers: {[key: string]: string} = {};
        
        await Promise.all(CATEGORIES.map(async (cat) => {
            try {
                const endpoint = cat.id === 'trending' ? 'featured' : 'search';
                const params: any = {
                    key: TENOR_KEY,
                    client_key: CLIENT_KEY,
                    limit: 5, // Fetch top 5 to pick one randomly
                    media_filter: 'minimal',
                    q: cat.query
                };
                
                const res = await axios.get(`https://tenor.googleapis.com/v2/${endpoint}`, { params });
                if (res.data.results.length > 0) {
                    const randomIndex = Math.floor(Math.random() * Math.min(res.data.results.length, 5));
                    covers[cat.id] = res.data.results[randomIndex].media_formats.tinygif.url;
                }
            } catch (err) {
                console.error(`Failed to fetch cover for ${cat.label}`, err);
            }
        }));
        setCategoryCovers(covers);
    };

    fetchCovers();
  }, []);

  // Reset scroll when category changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeCategory, search]);

  const fetchGifs = async (query: string = '', pos: string = '', isNewSearch: boolean = false) => {
    if (loading && !isNewSearch) return;
    setLoading(true);
    try {
      const endpoint = query ? 'search' : 'featured';
      const params: any = {
        key: TENOR_KEY,
        client_key: CLIENT_KEY,
        limit: 20,
        media_filter: 'minimal',
        pos: pos
      };
      
      if (query) params.q = query;

      const res = await axios.get(`https://tenor.googleapis.com/v2/${endpoint}`, { params });
      
      if (pos && !isNewSearch) {
        setGifs(prev => [...prev, ...res.data.results]);
      } else {
        setGifs(res.data.results);
      }
      setNextPos(res.data.next);
    } catch (err) {
      console.error("Tenor API Error", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch for a category or search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncing(false);
        if (search) {
            fetchGifs(search, '', true);
        } else if (activeCategory) {
            fetchGifs(activeCategory === 'trending' ? '' : activeCategory, '', true);
        } else {
            setGifs([]); // Home screen, no GIFs loaded yet
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setDebouncing(true);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200 && nextPos && !loading && !debouncing) {
        fetchGifs(search || (activeCategory === 'trending' ? '' : activeCategory || ''), nextPos);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setSearch('');
    setDebouncing(true);
  };

  const handleBack = () => {
    setActiveCategory(null);
    setSearch('');
    setGifs([]);
  };

  const showHome = !search && !activeCategory;
  const showSkeleton = loading || debouncing;

  return (
    <div className="w-[450px] h-[500px] bg-background-secondary rounded-lg shadow-2xl border border-background-tertiary flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-background-tertiary bg-background-secondary z-10 space-y-3">
        <div className="relative flex items-center gap-2">
            {(activeCategory || search) && (
                <button 
                    onClick={handleBack}
                    className="p-2 hover:bg-background-tertiary rounded-full text-text-muted hover:text-text-normal transition-colors"
                    title="Retour"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            <div className="relative flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Rechercher un GIF"
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full bg-background-tertiary text-text-normal text-sm rounded px-3 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-brand placeholder-text-muted transition-all"
                    autoFocus
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
            </div>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-background-primary"
      >
        {showHome ? (
            /* Home View: Categories */
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className="relative h-28 rounded-lg overflow-hidden group transition-all hover:scale-[1.02] active:scale-95 ring-offset-2 focus:ring-2 ring-brand outline-none bg-background-tertiary"
                    >
                        {/* Background Image */}
                        {categoryCovers[cat.id] ? (
                            <img 
                                src={categoryCovers[cat.id]} 
                                alt={cat.label} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" 
                            />
                        ) : (
                            <div className="absolute inset-0 bg-background-tertiary animate-pulse" />
                        )}
                        
                        {/* Dark Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        
                        {/* Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-md z-10">
                            <span className="font-bold text-lg tracking-wide drop-shadow-lg">{cat.label}</span>
                        </div>
                    </button>
                ))}
            </div>
        ) : (
            /* Results View: Masonry Grid */
            <div className="columns-2 gap-2 space-y-2">
                {gifs.map((gif) => (
                    <div 
                        key={gif.id} 
                        className="break-inside-avoid relative rounded-md overflow-hidden cursor-pointer group hover:ring-2 ring-brand transition-all bg-background-tertiary"
                        onClick={() => onSelect(gif.media_formats.gif.url)}
                    >
                        <img 
                            src={gif.media_formats.tinygif.url} 
                            alt={gif.content_description}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                ))}
                
                {showSkeleton && (
                    /* Skeleton Loader */
                    <>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="break-inside-avoid relative rounded-md overflow-hidden bg-background-tertiary animate-pulse" style={{ height: Math.random() > 0.5 ? '150px' : '200px' }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                            </div>
                        ))}
                    </>
                )}
                
                {!showSkeleton && gifs.length === 0 && (
                    <div className="py-12 text-center text-text-muted flex flex-col items-center col-span-2">
                        <Search className="w-12 h-12 mb-2 opacity-20" />
                        <p>Aucun GIF trouvé pour "{search}"</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
