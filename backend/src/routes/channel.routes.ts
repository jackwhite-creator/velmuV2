import { Router } from 'express';
import { createChannel, updateChannel, deleteChannel, reorderChannels } from '../controllers/channel.controller';
import { getChannelMessages, sendChannelMessage } from '../controllers/message.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);

// Channel management
router.post('/', createChannel);
router.put('/reorder', reorderChannels);
router.put('/:channelId', updateChannel);
router.delete('/:channelId', deleteChannel);

// Channel messages
router.get('/:channelId/messages', getChannelMessages);
router.post('/:channelId/messages', upload.single('file'), sendChannelMessage);

export default router;