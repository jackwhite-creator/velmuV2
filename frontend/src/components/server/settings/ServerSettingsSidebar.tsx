import { Server } from '../../../store/serverStore';
import { useAuthStore } from '../../../store/authStore';
import { Permissions } from '@backend/shared/permissions';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  server: Server;
  onDelete: () => void;
}



export default function ServerSettingsSidebar({ activeTab, onTabChange, server, onDelete }: Props) {
  const { user } = useAuthStore();
  const myMember = server.members?.find(m => m.userId === user?.id);
  const isOwner = server.ownerId === user?.id;

  const hasPermission = (permission: Permissions) => {
    if (isOwner) return true;
    if (!myMember) return false;
    
    return myMember.roles.some((memberRole: any) => {
      const serverRole = server.roles?.find((r: any) => r.id === memberRole.id);
      return serverRole?.permissions?.includes(Permissions.ADMINISTRATOR) || serverRole?.permissions?.includes(permission);
    });
  };

  const hasManageServer = hasPermission(Permissions.MANAGE_SERVER);
  const hasManageRoles = hasPermission(Permissions.MANAGE_ROLES);
  const hasCreateInvite = hasPermission(Permissions.CREATE_INVITES);

  // Group items into sections for consistent styling
  const sections = [
    {
        title: server.name, // Server name as the section header
        items: [
            ...(hasManageServer ? [{ id: 'overview', label: "Vue d'ensemble" }] : []),
            ...(hasManageRoles ? [{ id: 'roles', label: 'Rôles' }] : []),
            ...(hasCreateInvite || hasManageServer ? [{ id: 'invites', label: 'Invitations' }] : []),
            // Add more sections/items here as needed (e.g. Bans, Members)
        ]
    },
    {
        title: "Gestion des utilisateurs",
        items: [
             { id: 'members', label: 'Membres' },
             { id: 'bans', label: 'Bannissements' },
        ]
    }
  ];

  // Filter out empty sections or items based on permissions if needed
  // For now, we just render what we have. Note: 'members' and 'bans' might need permission checks too.
  // Let's assume 'members' needs MANAGE_SERVER or similar for now, or just show it.
  // The original code didn't have members/bans in the list, but the Modal had a placeholder for 'members'.
  // I will stick to the original items but style them better, maybe grouping them.
  
  const displaySections = [
      {
          title: server.name.toUpperCase(),
          items: [
            ...(hasManageServer ? [{ id: 'overview', label: "Vue d'ensemble" }] : []),
            ...(hasManageRoles ? [{ id: 'roles', label: 'Rôles' }] : []),
            ...(hasCreateInvite || hasManageServer ? [{ id: 'invites', label: 'Invitations' }] : []),
            // Adding Members back as it was in the switch case of Modal
            ...(hasManageServer ? [{ id: 'members', label: 'Membres' }] : []), 
          ]
      }
  ];

  return (
    <div className="w-full md:w-64 bg-background-secondary p-6 flex flex-col border-r border-background-tertiary h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {displaySections.map((section, index) => (
          <div key={section.title} className={index > 0 ? "mt-6" : ""}>
            <h2 className="text-xs font-black text-text-muted uppercase mb-2 tracking-widest px-2 truncate" title={section.title}>
                {section.title}
            </h2>
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

      {isOwner && (
        <div className="pt-4 border-t border-background-tertiary flex-shrink-0 mt-auto">
            <h2 className="text-xs font-black text-text-muted uppercase mb-2 tracking-widest px-2">Zone Danger</h2>
            <button 
                onClick={onDelete}
                className="w-full text-left px-3 py-2 rounded-md text-status-danger hover:bg-status-danger/10 text-base font-bold uppercase tracking-wide transition-colors flex items-center justify-between group"
            >
                <span>Supprimer le serveur</span>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        </div>
      )}
    </div>
  );
}
