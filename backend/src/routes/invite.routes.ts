import { Router } from 'express';
import { createInvite, getInvite, joinServerWithInvite } from '../controllers/invite.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create', authenticateToken, createInvite);

// GET /api/invites/:code - Get invite information (no auth required)
router.get('/:code', getInvite);

// POST /api/invites/:code/join
router.post('/:code/join', authenticateToken, joinServerWithInvite);

export default router;