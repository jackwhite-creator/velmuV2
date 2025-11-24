import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Modal from './ui/Modal';
import SettingsSidebar from './settings/SettingsSidebar';
import MyAccount from './settings/MyAccount';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Petits composants Placeholder pour les autres onglets (pour que ça marche)
const PlaceholderTab = ({ title }: { title: string }) => (
    <div className="p-10 text-text-normal">
        <h1 className="text-xl font-bold text-text-header mb-4">{title}</h1>
        <div className="p-6 border border-dashed border-text-muted/30 rounded-md text-center text-text-muted">
            Cette section est en cours de construction 🚧
        </div>
    </div>
);

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('account');

  if (!user) return null;

  // ✅ LOGIQUE DE SWITCH : Maintenant on gère les autres onglets
  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <MyAccount />;
      case 'appearance':
        return <PlaceholderTab title="Apparence" />;
      case 'notifications':
        return <PlaceholderTab title="Notifications" />;
      default:
        return <MyAccount />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col md:flex-row h-[600px] max-h-[85vh] bg-background-primary text-text-normal font-sans select-none overflow-hidden rounded-lg relative">
        
        <SettingsSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onClose={onClose} 
        />

        <div className="flex-1 flex flex-col relative bg-background-primary h-full min-w-0">
          
          {/* ✅ BOUTON FERMER CORRIGÉ : Croix simple, sans bordure, style sobre */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 flex flex-col items-center justify-center w-8 h-8 rounded-sm text-text-muted hover:text-text-normal hover:bg-background-modifier-hover transition z-50"
            title="Fermer"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             <span className="text-[9px] font-bold uppercase mt-[-3px] tracking-wider">Echap</span>
          </button>

          {renderContent()}
          
        </div>
      </div>
    </Modal>
  );
}