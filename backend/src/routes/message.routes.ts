import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { updateMessage, deleteMessage, createMessage, getMessages } from '../controllers/message.controller';

const router = Router();

router.use(authenticateToken);

// GET /api/messages?channelId=123&cursor=abc
router.get('/', getMessages); 

// POST /api/messages
router.post('/', upload.single('file'), createMessage);

// PUT & DELETE
router.put('/:messageId', updateMessage);
router.delete('/:messageId', deleteMessage);

export default router;