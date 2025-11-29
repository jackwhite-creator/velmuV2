import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { Permissions } from '@backend/shared/permissions'; // Shared via path alias

export function usePermission(permission: Permissions | Permissions[]) {
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();

  return useMemo(() => {
    if (!user || !activeServer) return false;

    // 1. Owner Override
    if (activeServer.ownerId === user.id) return true;

    // 2. Get User Member Object
    const member = activeServer.members?.find(m => m.userId === user.id);
    if (!member) return false;

    // 3. Flatten all permissions from all roles
    // member.roles is populated in the store
    const allPermissions = new Set<string>();

    member.roles.forEach(role => {
        // Parse permissions from the role (assuming they are stored as strings in the DB/Store)
        // Adjust based on your actual data structure.
        // If the store has permissions as an array of strings:
        if (Array.isArray(role.permissions)) {
             role.permissions.forEach(p => allPermissions.add(p));
        } else if (typeof role.permissions === 'string') {
             // If stored as JSON string or comma separated (unlikely based on Prisma schema but possible in legacy)
             // Prisma schema says String[] so it should be array.
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
