import { Router } from 'express';
import { getServerRoles, createRole, updateRole, deleteRole, updateRolePositions } from '../controllers/role.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireServerPermission } from '../middlewares/permissions.middleware';
import { Permissions } from '../shared/permissions';

const router = Router();

router.use(authenticateToken);

// All these routes require MANAGE_ROLES permission on the specific server
// The serverId is extracted from the URL path: /api/servers/:serverId/roles...

router.get('/servers/:serverId/roles', getServerRoles);
router.post('/servers/:serverId/roles', requireServerPermission(Permissions.MANAGE_ROLES), createRole);
router.put('/servers/:serverId/roles/positions', requireServerPermission(Permissions.MANAGE_ROLES), updateRolePositions);
router.put('/servers/:serverId/roles/:roleId', requireServerPermission(Permissions.MANAGE_ROLES), updateRole);
router.delete('/servers/:serverId/roles/:roleId', requireServerPermission(Permissions.MANAGE_ROLES), deleteRole);

export default router;
