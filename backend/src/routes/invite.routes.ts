import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { InviteController } from '../controllers/invite.controller';

const router = Router();

// ✅ Route PUBLIQUE (pas de authenticateToken) pour voir les infos avant de rejoindre
router.get('/:code', InviteController.getInviteInfo);

// Routes protégées
router.post('/create', authenticateToken, InviteController.create);
router.post('/:code/join', authenticateToken, InviteController.join);

export default router;