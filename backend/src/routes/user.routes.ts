import { Router } from 'express';
import { updateProfile, getUserProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.put('/me', 
  authenticateToken, 
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]), 
  updateProfile
);
    
router.get('/:userId', authenticateToken, getUserProfile);

export default router;