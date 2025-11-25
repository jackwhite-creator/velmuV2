import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:serverId', authenticateToken, MemberController.getByServerId);

router.delete('/:serverId/kick/:memberId', authenticateToken, MemberController.kick);

export default router;