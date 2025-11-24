import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Server, Channel, Category, useServerStore } from '../../store/serverStore';
import api from '../../lib/api';
import Tooltip from '../ui/Tooltip';

interface Props {
  server: Server;
  activeChannel: Channel | null;
  isOwner: boolean;
  onChannelSelect: (c: Channel) => void;
  onCreateChannel: (catId: string) => void;
  onEditChannel: (c: Channel) => void;
  onContextMenuGlobal: (e: React.MouseEvent) => void;
  onContextMenuChannel: (e: React.MouseEvent, channel: Channel) => void;
  onContextMenuCategory: (e: React.MouseEvent, category: Category) => void;
}

// --- ICONES (Petites et fines pour le style compact) ---
const HashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
);

const SpeakerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-100 ${isOpen ? 'rotate-90' : ''}`}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export default function ChannelList({ 
  server, activeChannel, isOwner, 
  onChannelSelect, onCreateChannel, onEditChannel,
  onContextMenuGlobal,
  onContextMenuChannel, onContextMenuCategory 
}: Props) {
  const { setActiveServer } = useServerStore();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem('velmu_collapsed_cats');
    if (stored) {
      try { setCollapsedCategories(new Set(JSON.parse(stored))); } 
      catch (e) { console.error(e); }
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(collapsedCategories);
    if (newSet.has(categoryId)) newSet.delete(categoryId);
    else newSet.add(categoryId);
    setCollapsedCategories(newSet);
    localStorage.setItem('velmu_collapsed_cats', JSON.stringify([...newSet]));
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newCategories = JSON.parse(JSON.stringify(server.categories)) as Category[];

    if (type === 'CATEGORY') {
        const [movedCategory] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, movedCategory);
        setActiveServer({ ...server, categories: newCategories });
        try {
            const orderedIds = newCategories.map(c => c.id);
            await api.put('/categories/reorder', { serverId: server.id, orderedIds });
        } catch (err) { console.error(err); }
        return;
    }

    const sourceCatIndex = newCategories.findIndex(c => c.id === source.droppableId);
    const destCatIndex = newCategories.findIndex(c => c.id === destination.droppableId);
    if (sourceCatIndex === -1 || destCatIndex === -1) return;

    const sourceCat = newCategories[sourceCatIndex];
    const destCat = newCategories[destCatIndex];
    const [movedChannel] = sourceCat.channels.splice(source.index, 1);
    destCat.channels.splice(destination.index, 0, movedChannel);

    setActiveServer({ ...server, categories: newCategories });

    try {
        const orderedIds = destCat.channels.map(c => c.id);
        await api.put('/channels/reorder', {
            activeId: draggableId,
            categoryId: destCat.id,
            orderedIds
        });
    } catch (err) { console.error(err); }
  };

  if (!server.categories) return <div className="text-center mt-4 text-zinc-500 text-xs px-2 font-mono">...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="server-categories" type="CATEGORY">
            {(provided) => (
                // ✅ Padding réduit et structure "List"
                <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    onContextMenu={onContextMenuGlobal} 
                    className="flex-1 overflow-y-auto custom-scrollbar pt-3 px-2 pb-8 space-y-4"
                >
                    {server.categories?.map((cat, index) => {
                        const isCollapsed = collapsedCategories.has(cat.id);
                        return (
                            <Draggable key={cat.id} draggableId={cat.id} index={index} isDragDisabled={!isOwner}>
                                {(provided, snapshot) => (
                                    <div 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`transition-opacity ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                    >
                                        {/* HEADER CATÉGORIE COMPACT */}
                                        <div 
                                            {...provided.dragHandleProps}
                                            className="flex items-center justify-between px-0.5 mb-0.5 group cursor-pointer hover:text-zinc-300 text-zinc-500 select-none pt-2"
                                            onContextMenu={(e) => { e.stopPropagation(); onContextMenuCategory(e, cat); }}
                                            onClick={() => toggleCategory(cat.id)}
                                        >
                                            <div className="font-bold text-[10px] uppercase tracking-wide flex items-center gap-0.5 truncate flex-1 group-hover:text-zinc-300 transition-colors" title={cat.name}>
                                                <div className="text-zinc-600 transition-transform duration-100">
                                                    <ChevronIcon isOpen={!isCollapsed} />
                                                </div>
                                                <span className="truncate mt-[1px] font-bold">{cat.name}</span>
                                            </div>
                                            {isOwner && (
                                                <Tooltip text="Créer un salon" side="top">
                                                    <span 
                                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                                                        onClick={(e) => { e.stopPropagation(); onCreateChannel(cat.id); }}
                                                    >
                                                        <PlusIcon />
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* LISTE DES SALONS */}
                                        {!isCollapsed && (
                                            <Droppable droppableId={cat.id} type="CHANNEL">
                                                {(provided, snapshot) => (
                                                    <div {...provided.droppableProps} ref={provided.innerRef} className={`space-y-[1px] min-h-[2px] ${snapshot.isDraggingOver ? 'bg-zinc-800/30 rounded' : ''}`}>
                                                        {cat.channels?.map((channel, index) => {
                                                            const isActive = activeChannel?.id === channel.id;
                                                            return (
                                                                <Draggable key={channel.id} draggableId={channel.id} index={index} isDragDisabled={!isOwner}>
                                                                    {(provided, snapshot) => (
                                                                        <div 
                                                                            ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                                                                            style={{ ...provided.draggableProps.style }} 
                                                                            onClick={() => onChannelSelect(channel)} 
                                                                            onContextMenu={(e) => { e.stopPropagation(); onContextMenuChannel(e, channel); }}
                                                                            // ✅ ITEM SALON COMPACT : rounded-sm, py-1.5, fond zinc
                                                                            className={`
                                                                                relative px-2 py-[5px] rounded-sm flex items-center gap-1.5 cursor-pointer group transition-colors mx-0.5
                                                                                ${isActive 
                                                                                    ? 'bg-zinc-700/80 text-white' 
                                                                                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'} 
                                                                                ${snapshot.isDragging ? 'bg-zinc-800 shadow-lg opacity-100 z-50 scale-105' : ''}
                                                                            `}
                                                                        >
                                                                            <div className="flex-shrink-0 opacity-60 group-hover:opacity-100">
                                                                                {channel.type === 'voice' ? <SpeakerIcon /> : <HashIcon />}
                                                                            </div>
                                                                            
                                                                            <span className={`font-medium text-[14px] truncate flex-1 leading-5 select-none ${isActive ? 'text-white' : ''}`}>{channel.name}</span>
                                                                            
                                                                            {isOwner && (
                                                                                <Tooltip text="Modifier" side="top">
                                                                                    <div 
                                                                                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 flex-shrink-0 transition-opacity p-0.5"
                                                                                        onClick={(e) => { e.stopPropagation(); onEditChannel(channel); }}
                                                                                    >
                                                                                        <SettingsIcon />
                                                                                    </div>
                                                                                </Tooltip>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        )}
                                    </div>
                                )}
                            </Draggable>
                        );
                    })}
                    {provided.placeholder}
                    
                    <div className="flex-1 min-h-[50px]" onContextMenu={onContextMenuGlobal}></div>
                </div>
            )}
        </Droppable>
    </DragDropContext>
  );
}