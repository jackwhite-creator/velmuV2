import { Router } from 'express';
import { getServerMembers, kickMember, updateMember } from '../controllers/member.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.put('/:serverId/update/:memberId', authenticateToken, updateMember);
router.get('/:serverId', authenticateToken, getServerMembers);
router.delete('/:serverId/kick/:memberId', authenticateToken, kickMember);

export default router;