import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', ConversationController.getOrCreate);
router.get('/me', ConversationController.getMyConversations);
router.post('/:conversationId/read', ConversationController.markAsRead);
router.post('/:conversationId/close', ConversationController.closeConversation); // <--- AJOUT

export default router;