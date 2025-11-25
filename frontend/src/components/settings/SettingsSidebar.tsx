import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
}

export default function SettingsSidebar({ activeTab, onTabChange, onClose }: Props) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const menuItems = [
    { id: 'account', label: 'Ton compte' },
  ];

  const handleLogout = () => {
      logout();
      onClose();
      navigate('/login');
  };

  return (
    <div className="w-full md:w-64 bg-background-secondary p-6 flex flex-col border-r border-background-tertiary h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-xs font-bold text-text-muted uppercase mb-3 tracking-wider px-2">Paramètres utilisateur</h2>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-3 py-1.5 rounded-sm text-sm font-medium transition-colors
                ${activeTab === item.id 
                  ? 'bg-background-modifier-selected text-text-header' 
                  : 'text-text-normal hover:bg-background-modifier-hover hover:text-text-header'}
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-background-tertiary flex-shrink-0">
        <button 
          onClick={handleLogout}
          className="w-full text-left px-3 py-1.5 rounded-sm text-status-danger hover:bg-status-danger/10 text-sm font-medium transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}