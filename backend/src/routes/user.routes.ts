import { Router } from 'express';
import { updateUser, getUser, getCurrentUser, getUserServers } from '../controllers/user.controller';
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
  updateUser
);
    
router.get('/me', authenticateToken, getCurrentUser);
router.get('/me/servers', authenticateToken, getUserServers);
router.get('/:userId', authenticateToken, getUser);

export default router;