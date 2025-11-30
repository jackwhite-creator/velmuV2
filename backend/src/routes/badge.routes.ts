import { Router } from 'express';
import * as badgeController from '../controllers/badge.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (or authenticated but for everyone)
router.get('/', badgeController.getAllBadges);
router.get('/users/:userId', badgeController.getUserBadges);

// Protected routes (Admin only - TODO: Add admin middleware)
router.post('/assign', authenticateToken, badgeController.assignBadge);
router.post('/remove', authenticateToken, badgeController.removeBadge);


export default router;
