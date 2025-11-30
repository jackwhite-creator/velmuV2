import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { Permissions } from '@backend/shared/permissions'; // Shared via path alias

export function usePermission(permission: Permissions | Permissions[]) {
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();

  return useMemo(() => {
    if (!user) return false;
    if (!activeServer) return true; // DM Mode or no server selected -> Allow by default (or handle differently)

    // 1. Owner Override
    if (activeServer.ownerId === user.id) return true;

    // 2. Get User Member Object
    const member = activeServer.members?.find(m => m.userId === user.id);
    if (!member) return false;

    // 3. Flatten all permissions from all roles
    // The backend returns member.roleIds (array of IDs), not member.roles (full objects)
    // We need to join roleIds with activeServer.roles to get the full Role objects
    const allPermissions = new Set<string>();

    // Get role IDs from member (could be in roleIds or roles depending on data structure)
    const memberRoleIds = (member as any).roleIds || [];
    
    memberRoleIds.forEach((roleId: string) => {
        // Find the full role definition in the server's roles list
        const serverRole = activeServer.roles?.find((r: any) => r.id === roleId);
        
        if (serverRole && Array.isArray(serverRole.permissions)) {
             serverRole.permissions.forEach((p: string) => allPermissions.add(p));
        }
    });

    // 4. Check for ADMINISTRATOR
    if (allPermissions.has(Permissions.ADMINISTRATOR)) return true;

    // 5. Check specific permission
    if (Array.isArray(permission)) {
        return permission.every(p => allPermissions.has(p));
    }
    return allPermissions.has(permission);

  }, [user, activeServer, permission]);
}
