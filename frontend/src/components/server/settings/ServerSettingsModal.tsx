import { useState } from 'react';
import { useServerStore, Server } from '../../../store/serverStore';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import Modal from '../../ui/Modal';
import ConfirmModal from '../../ui/ConfirmModal';
import ServerSettingsSidebar from './ServerSettingsSidebar';
import ServerOverview from './ServerOverview';
import ServerInvites from './ServerInvites';
import ServerRoles from './ServerRoles';

const PlaceholderTab = ({ title }: { title: string }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>Cette section est en cours de développement.</p>
    </div>
);

interface Props {
  isOpen: boolean;
  server: Server;
  onClose: () => void;
}

export default function ServerSettingsModal({ isOpen, server, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { removeServer, setActiveServer } = useServerStore();
  const navigate = useNavigate();

  const handleDeleteServer = async () => {
    try {
        await api.delete(`/servers/${server.id}`);
        removeServer(server.id);
        setActiveServer(null);
        onClose();
        navigate('/channels/@me');
    } catch (error) {
        console.error("Erreur suppression serveur", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <ServerOverview server={server} />;
      case 'roles': return <ServerRoles serverId={server.id} />;
      case 'members': return <PlaceholderTab title="Membres" />;
      // ✅ AJOUT DU CAS POUR LES INVITATIONS
      case 'invites': return <ServerInvites server={server} />;
      default: return <ServerOverview server={server} />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="flex flex-col md:flex-row h-[600px] max-h-[85vh] bg-background-primary text-text-normal font-sans select-none overflow-hidden rounded-md relative">
            
            <ServerSettingsSidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                server={server}
                onDelete={() => setConfirmDeleteOpen(true)}
            />

            <div className="flex-1 flex flex-col relative bg-background-primary h-full min-w-0">
            
            {/* Bouton Fermer */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 flex flex-col items-center justify-center w-8 h-8 rounded-sm text-text-muted hover:text-text-normal hover:bg-background-modifier-hover transition z-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span className="text-[10px] font-bold uppercase mt-[-3px]">Echap</span>
            </button>

            {renderContent()}
            
            </div>
        </div>
        </Modal>

        <ConfirmModal 
            isOpen={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            onConfirm={handleDeleteServer}
            title={`Supprimer ${server.name}`}
            message="Es-tu sûr de vouloir supprimer ce serveur ? Cette action est irréversible."
            isDestructive={true}
            confirmText="Supprimer le serveur"
        />
    </>
  );
}