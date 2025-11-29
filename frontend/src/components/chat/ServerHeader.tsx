import { useState } from 'react';
import { Server } from '../../store/serverStore';
import ConfirmModal from '../ui/ConfirmModal';
import api from '../../lib/api';
import { useServerStore } from '../../store/serverStore';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { Permissions } from '@backend/shared/permissions';

interface Props {
  server: Server;
  isOwner: boolean;
  socket: Socket | null;
  onInvite: () => void;
  onOpenSettings: () => void;
  onCreateChannel: () => void;
}

export default function ServerHeader({ server, isOwner, socket, onInvite, onOpenSettings, onCreateChannel }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '' as React.ReactNode, action: async () => {}, confirmText: 'Confirmer' });
  
  const { setServers, servers, setActiveServer, setActiveChannel } = useServerStore();
  const { user } = useAuthStore();

  const myMember = server.members?.find(m => m.userId === user?.id);
  const hasManageServer = isOwner || myMember?.roles.some(r => r.permissions.includes(Permissions.MANAGE_SERVER) || r.permissions.includes(Permissions.ADMINISTRATOR));
  const hasCreateChannel = isOwner || myMember?.roles.some(r => r.permissions.includes(Permissions.MANAGE_CHANNELS) || r.permissions.includes(Permissions.ADMINISTRATOR));
  const hasCreateInvite = isOwner || myMember?.roles.some(r => r.permissions.includes(Permissions.CREATE_INVITES) || r.permissions.includes(Permissions.ADMINISTRATOR));

  const handleDeleteServer = () => {
    setIsMenuOpen(false);
    setConfirmConfig({
      title: `Supprimer '${server.name}'`,
      message: <span>Êtes-vous sûr ? Cette action est <strong className="text-red-400">irréversible</strong>.</span>,
      confirmText: 'Supprimer',
      action: async () => {
        await api.delete(`/servers/${server.id}`);
        const newServers = servers.filter(s => s.id !== server.id);
        setServers(newServers);
        setActiveServer(newServers[0] || null);
        setActiveChannel(null);
        socket?.emit('leave_server', server.id);
      }
    });
    setConfirmOpen(true);
  };

  const handleLeaveServer = () => {
    setIsMenuOpen(false);
    setConfirmConfig({
      title: `Quitter '${server.name}'`,
      message: "Voulez-vous vraiment quitter ce serveur ?",
      confirmText: 'Quitter',
      action: async () => {
        await api.post(`/servers/${server.id}/leave`);
        const newServers = servers.filter(s => s.id !== server.id);
        setServers(newServers);
        setActiveServer(newServers[0] || null);
        setActiveChannel(null);
        localStorage.removeItem('lastServerId');
        socket?.emit('leave_server', server.id);
      }
    });
    setConfirmOpen(true);
  };

  return (
    <>
      <div className="relative shadow-sm border-b border-slate-900 z-50">
        <div 
            className="h-12 px-4 hover:bg-slate-700/30 transition cursor-pointer flex items-center justify-between"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
            <h1 className="font-bold text-white truncate max-w-[150px]">{server.name}</h1>
            {isMenuOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m6 9 6 6 6-6"/></svg>}
        </div>

        {isMenuOpen && (
            <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute top-14 left-2 w-56 bg-[#111214] rounded-md shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 border border-slate-900">
                    {hasCreateInvite && (
                        <div onClick={() => { onInvite(); setIsMenuOpen(false); }} className="flex justify-between items-center px-2 py-2 rounded-sm hover:bg-indigo-600 hover:text-white text-indigo-400 cursor-pointer mb-1">
                            <span className="text-sm font-medium">Inviter des gens</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        </div>
                    )}
                    
                    {hasManageServer && (
                        <div onClick={() => { onOpenSettings(); setIsMenuOpen(false); }} className="flex justify-between items-center px-2 py-2 rounded-sm hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer">
                            <span className="text-sm font-medium">Paramètres</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </div>
                    )}

                    {hasCreateChannel && (
                        <div onClick={() => { onCreateChannel(); setIsMenuOpen(false); }} className="flex justify-between items-center px-2 py-2 rounded-sm hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer mb-1">
                            <span className="text-sm font-medium">Créer un salon</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        </div>
                    )}

                    <div className="h-[1px] bg-slate-700/50 my-1 mx-1"></div>
                    <div onClick={isOwner ? handleDeleteServer : handleLeaveServer} className="flex justify-between items-center px-2 py-2 rounded-sm hover:bg-red-500 text-red-400 hover:text-white cursor-pointer">
                        <span>{isOwner ? 'Supprimer' : 'Quitter'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </div>
                </div>
            </>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={confirmConfig.action} 
        title={confirmConfig.title} 
        message={confirmConfig.message} 
        isDestructive={true} 
        confirmText={confirmConfig.confirmText} 
      />
    </>
  );
}
