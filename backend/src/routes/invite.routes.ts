import { Router } from 'express';
import { createInvite, getInvite, joinServerWithInvite } from '../controllers/invite.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireServerPermission } from '../middlewares/permissions.middleware';
import { Permissions } from '../shared/permissions';

const router = Router();

// Require CREATE_INVITES permission
router.post('/create', authenticateToken, requireServerPermission(Permissions.CREATE_INVITES), createInvite);

// GET /api/invites/:code - Get invite information (no auth required)
router.get('/:code', getInvite);

// POST /api/invites/:code/join
router.post('/:code/join', authenticateToken, joinServerWithInvite);

export default router;