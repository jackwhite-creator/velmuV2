import { Router } from 'express';
import { updateProfile, getUserProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import { UpdateProfileSchema } from '../validators/schemas/user.schema';

const router = Router();

router.put('/me', 
  authenticateToken, 
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  validate(UpdateProfileSchema),
  updateProfile
);
    
router.get('/:userId', authenticateToken, getUserProfile);

export default router;