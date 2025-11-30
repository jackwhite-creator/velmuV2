import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { updateMessage, deleteMessage, createMessage, getMessages } from '../controllers/message.controller';
import { requireServerPermission } from '../middlewares/permissions.middleware';
import { Permissions } from '../shared/permissions';

const router = Router();

router.use(authenticateToken);

// Rate limiter pour les messages
// Discord-like: ~2 messages/seconde = 120/minute
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 messages par minute max
  message: { error: 'Vous envoyez des messages trop rapidement. Ralentissez.' },
  standardHeaders: true,
  legacyHeaders: false
});

// GET /api/messages?channelId=123&cursor=abc
router.get('/', getMessages); 

// POST /api/messages
// Check SEND_MESSAGES. Note: Middleware handles DMs gracefully (skips check if no server context)
router.post('/', messageLimiter, requireServerPermission(Permissions.SEND_MESSAGES), upload.array('files', 10), createMessage);

// PUT & DELETE
router.put('/:messageId', updateMessage);
router.delete('/:messageId', deleteMessage);

export default router;