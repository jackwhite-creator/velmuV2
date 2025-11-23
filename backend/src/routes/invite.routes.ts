import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// 👇 C'EST CETTE LIGNE QUI MANQUAIT !
router.post('/create', authenticateToken, InviteController.create);

// POST /api/invites/:code/join
router.post('/:code/join', authenticateToken, InviteController.join);

export default router;