import { Router } from 'express';
import { updateProfile, getUserProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// PUT /api/users/me
router.put('/me', authenticateToken, updateProfile);

// GET /api/users/:userId
router.get('/:userId', authenticateToken, getUserProfile);

export default router;