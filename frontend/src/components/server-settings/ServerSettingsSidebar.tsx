import { Server } from '../../store/serverStore';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  server: Server;
  onDelete: () => void;
}

export default function ServerSettingsSidebar({ activeTab, onTabChange, server, onDelete }: Props) {
  // ✅ NETTOYAGE : On ne garde que les onglets actifs
  const menuItems = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'invites', label: 'Invitations' },
  ];

  return (
    <div className="w-full md:w-60 bg-background-secondary p-4 flex flex-col border-r border-background-tertiary h-full pt-10">
      <h2 className="text-xs font-bold text-text-muted uppercase mb-3 px-2 tracking-wide truncate">
        {server.name}
      </h2>
      
      <nav className="space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full text-left px-3 py-1.5 rounded-sm text-sm font-medium transition-colors mb-0.5
              ${activeTab === item.id 
                ? 'bg-background-modifier-selected text-text-header' 
                : 'text-text-normal hover:bg-background-modifier-hover hover:text-text-header'}
            `}
          >
            {item.label}
          </button>
        ))}
        
        <div className="my-2 border-t border-background-tertiary mx-2"></div>
        
        <button 
            onClick={onDelete}
            className="w-full text-left px-3 py-1.5 rounded-sm text-status-danger hover:bg-status-danger/10 text-sm font-medium transition-colors flex items-center justify-between group"
        >
            <span>Supprimer le serveur</span>
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </nav>
    </div>
  );
}