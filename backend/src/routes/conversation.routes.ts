import { Router } from 'express';
import { getUserConversations, createConversation, markAsRead, closeConversation } from '../controllers/conversation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createConversation);
router.get('/me', getUserConversations);
router.post('/:conversationId/read', markAsRead);
router.post('/:conversationId/close', closeConversation); // <--- AJOUT

export default router;