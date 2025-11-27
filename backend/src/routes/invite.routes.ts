import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create', authenticateToken, InviteController.create);

// GET /api/invites/:code - Get invite information (no auth required)
router.get('/:code', InviteController.getInviteInfo);

// POST /api/invites/:code/join
router.post('/:code/join', authenticateToken, InviteController.join);

export default router;