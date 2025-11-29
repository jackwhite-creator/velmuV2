import { Router } from 'express';
import { createChannel, updateChannel, deleteChannel, reorderChannels } from '../controllers/channel.controller';
import { getChannelMessages, sendChannelMessage } from '../controllers/message.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireServerPermission } from '../middlewares/permissions.middleware';
import { upload } from '../middlewares/upload.middleware';
import { Permissions } from '../shared/permissions';

const router = Router();

router.use(authenticateToken);

// Channel management
router.post('/', requireServerPermission(Permissions.MANAGE_CHANNELS), createChannel);
router.put('/reorder', requireServerPermission(Permissions.MANAGE_CHANNELS), reorderChannels);
// Note: for update/delete where serverId is not in body/params but implied by channelId,
// we rely on the service layer check or need a middleware that fetches channel first.
// For now, let's keep it simple and rely on service layer for update/delete or add serverId to params.
router.put('/:channelId', updateChannel); 
router.delete('/:channelId', deleteChannel);

// Channel messages
router.get('/:channelId/messages', getChannelMessages);
router.post('/:channelId/messages', upload.single('file'), sendChannelMessage);

export default router;