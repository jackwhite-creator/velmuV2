import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/members/:serverId
router.get('/:serverId', authenticateToken, MemberController.getByServerId);

// 👇 CORRECTION ICI : On remplace :userId par :memberId
router.delete('/:serverId/kick/:memberId', authenticateToken, MemberController.kick);

export default router;