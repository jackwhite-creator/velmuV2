import { Router } from 'express';
import { getToken } from '../controllers/livekit.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/token', authenticateToken, getToken);

export default router;
