import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServerStore, Server, Channel, Category } from '../../store/serverStore';
import api from '../../lib/api';
import { Socket } from 'socket.io-client';

// UI
import EditServerModal from '../ui/EditServerModal';
import ConfirmModal from '../ui/ConfirmModal';
import CreateCategoryModal from '../ui/CreateCategoryModal';
import EditCategoryModal from '../ui/EditCategoryModal';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ui/ContextMenu';

// Modals
import ChannelModal from '../ui/ChannelModal';

// Chat Components
import ServerHeader from '../chat/ServerHeader';
import ChannelList from '../chat/ChannelList';

interface Props {
  activeServer: Server;
  activeChannel: Channel | null;
  socket: Socket | null;
  onChannelSelect: (channel: Channel) => void;
  onInvite: () => void;
  onOpenProfile: () => void;
}

type MenuType = 'GLOBAL' | 'CHANNEL' | 'CATEGORY';

// Icônes standards (16px)
const Icons = {
  Add: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Folder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
};

export default function ServerChannels({ 
  activeServer, activeChannel, socket, 
  onChannelSelect, onInvite, onOpenProfile 
}: Props) {
  const { user } = useAuthStore();
  const { setActiveServer } = useServerStore();
  
  const [isEditServerOpen, setIsEditServerOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [createChannelCategoryId, setCreateChannelCategoryId] = useState<string | null>(null);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '' as React.ReactNode,
    action: async () => {},
    isDestructive: false,
    confirmText: 'Confirmer'
  });

  const [contextMenu, setContextMenu] = useState<{ 
      x: number; y: number; type: MenuType; data?: any 
  } | null>(null);

  useEffect(() => {
      if (activeServer && !activeServer.categories) {
          api.get(`/servers/${activeServer.id}`).then(res => setActiveServer(res.data)).catch(console.error);
      }
  }, [activeServer?.id, activeServer?.categories, setActiveServer]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (!activeServer) return <div className="w-60 bg-[#2b2d31] h-full" />;

  const isOwner = activeServer.ownerId === user?.id;

  const handleGlobalCreateChannel = () => {
      const firstCat = activeServer.categories?.[0];
      if (firstCat) {
        setCreateChannelCategoryId(firstCat.id);
      } else {
        setIsCreateCategoryOpen(true);
      }
      setContextMenu(null);
  };

  const handleContextMenuGlobal = (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'GLOBAL' });
  };

  const handleContextMenuChannel = (e: React.MouseEvent, channel: Channel) => {
      if (!isOwner) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'CHANNEL', data: channel });
  };

  const handleContextMenuCategory = (e: React.MouseEvent, category: Category) => {
      if (!isOwner) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'CATEGORY', data: category });
  };

  const handleDeleteChannelContext = () => {
      const channel = contextMenu?.data; 
      if (!channel) return;
      setContextMenu(null); 
      setConfirmConfig({
          title: `Supprimer #${channel.name}`,
          message: <span>Êtes-vous sûr de vouloir supprimer le salon <strong>#{channel.name}</strong> ?</span>,
          isDestructive: true,
          confirmText: 'Supprimer',
          action: async () => {
              try { await api.delete(`/channels/${channel.id}`); } catch (err) { console.error(err); }
          }
      });
      setConfirmOpen(true);
  };

  const handleDeleteCategoryContext = () => {
      const category = contextMenu?.data;
      if (!category) return;
      setContextMenu(null);
      setConfirmConfig({
          title: `Supprimer ${category.name}`,
          message: <span>Voulez-vous vraiment supprimer la catégorie <strong>{category.name}</strong> et tous ses salons ?</span>,
          isDestructive: true,
          confirmText: 'Supprimer',
          action: async () => {
              try { await api.delete(`/categories/${category.id}`); } catch (err) { console.error(err); }
          }
      });
      setConfirmOpen(true);
  };

  return (
    // ✅ FOND ZINC FONCÉ (#2b2d31) - Style compact et uni
    <div className="flex flex-col h-full bg-[#2b2d31] select-none" onContextMenu={handleContextMenuGlobal}>
        
        <ServerHeader 
            server={activeServer} 
            isOwner={isOwner} 
            socket={socket}
            onInvite={onInvite}
            onOpenSettings={() => setIsEditServerOpen(true)}
            onCreateChannel={handleGlobalCreateChannel}
        />
        
        <div className="flex-1 min-h-0">
            <ChannelList 
                server={activeServer}
                activeChannel={activeChannel}
                isOwner={isOwner}
                onChannelSelect={onChannelSelect}
                onCreateChannel={(catId) => setCreateChannelCategoryId(catId)}
                onEditChannel={setEditingChannel}
                onContextMenuGlobal={handleContextMenuGlobal}
                onContextMenuChannel={handleContextMenuChannel}
                onContextMenuCategory={handleContextMenuCategory}
            />
        </div>
        
        {contextMenu && (
            <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
                 {contextMenu.type === 'GLOBAL' && (
                    <>
                        <ContextMenuItem label="Créer un salon" onClick={handleGlobalCreateChannel} icon={Icons.Add} />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Créer une catégorie" onClick={() => { setIsCreateCategoryOpen(true); setContextMenu(null); }} icon={Icons.Folder} />
                    </>
                )}
                
                {contextMenu.type === 'CHANNEL' && (
                    <>
                        <ContextMenuItem label="Modifier le salon" onClick={() => { setEditingChannel(contextMenu.data); setContextMenu(null); }} icon={Icons.Edit} />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Supprimer le salon" onClick={handleDeleteChannelContext} variant="danger" icon={Icons.Trash} />
                    </>
                )}

                {contextMenu.type === 'CATEGORY' && (
                    <>
                        <ContextMenuItem label="Créer un salon" onClick={() => { setCreateChannelCategoryId(contextMenu.data.id); setContextMenu(null); }} icon={Icons.Add} />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Modifier la catégorie" onClick={() => { setEditingCategory(contextMenu.data); setContextMenu(null); }} icon={Icons.Edit} />
                        <ContextMenuItem label="Supprimer la catégorie" onClick={handleDeleteCategoryContext} variant="danger" icon={Icons.Trash} />
                    </>
                )}
            </ContextMenu>
        )}

        <EditServerModal isOpen={isEditServerOpen} server={activeServer} onClose={() => setIsEditServerOpen(false)} />
        <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmConfig.action} title={confirmConfig.title} message={confirmConfig.message} isDestructive={confirmConfig.isDestructive} confirmText={confirmConfig.confirmText} />
        <CreateCategoryModal isOpen={isCreateCategoryOpen} onClose={() => setIsCreateCategoryOpen(false)} serverId={activeServer.id} />
        <EditCategoryModal isOpen={!!editingCategory} category={editingCategory} onClose={() => setEditingCategory(null)} />

        <ChannelModal 
            isOpen={!!editingChannel} 
            channel={editingChannel} 
            onClose={() => setEditingChannel(null)} 
        />

        <ChannelModal 
            isOpen={!!createChannelCategoryId} 
            categoryId={createChannelCategoryId || undefined}
            onClose={() => setCreateChannelCategoryId(null)}
            onSuccess={() => setCreateChannelCategoryId(null)}
        />

    </div>
  );
}