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

  const sections = [
    {
      title: 'Paramètres utilisateur',
      items: [
        { id: 'account', label: 'Ton compte' },
      ]
    },
    {
      title: "Paramètres de l'appli",
      items: [
        { id: 'appearance', label: 'Apparence' },
        { id: 'notifications', label: 'Notifications' },
      ]
    }
  ];

  const handleLogout = () => {
      logout();
      onClose();
      navigate('/login');
  };

  return (
    <div className="w-full md:w-64 bg-background-secondary p-6 flex flex-col border-r border-background-tertiary h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sections.map((section, index) => (
          <div key={section.title} className={index > 0 ? "mt-6" : ""}>
            <h2 className="text-xs font-black text-text-muted uppercase mb-2 tracking-widest px-2">{section.title}</h2>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-bold uppercase tracking-wide transition-all duration-200
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
        ))}
      </div>

      <div className="pt-4 border-t border-background-tertiary flex-shrink-0">
        <button 
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-status-danger hover:bg-status-danger/10 text-base font-bold uppercase tracking-wide transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}