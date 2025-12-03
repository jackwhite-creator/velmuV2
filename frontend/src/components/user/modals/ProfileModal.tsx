import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import Modal from '../../ui/Modal';
import SettingsSidebar from '../../settings/SettingsSidebar';
import MyAccount from '../../settings/MyAccount';
import Appearance from '../../settings/Appearance';
import Notifications from '../../settings/Notifications';
import DeveloperSettings from '../../settings/DeveloperSettings';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('account');

  if (!user) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <MyAccount />;
      case 'appearance':
        return <Appearance />;
      case 'notifications':
        return <Notifications />;
      case 'developer':
        return <DeveloperSettings />;
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
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-text-normal hover:bg-background-modifier-hover transition z-50"
            title="Fermer"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {renderContent()}
          
        </div>
      </div>
    </Modal>
  );
}