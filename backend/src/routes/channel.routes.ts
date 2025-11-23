import { Router } from 'express';
import { ChannelController } from '../controllers/channel.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
// 👇 Nouveaux imports pour les messages
import { getChannelMessages, createChannelMessage } from '../controllers/channel-message.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// On sécurise toutes les routes de ce fichier
router.use(authenticateToken);

// --- Gestion des Channels (Admin/Modif) ---
router.post('/', ChannelController.create);
router.put('/reorder', ChannelController.reorder);
router.put('/:channelId', ChannelController.update);
router.delete('/:channelId', ChannelController.delete);

// --- Gestion des Messages de Channels (Chat) ---
router.get('/:channelId/messages', getChannelMessages);
router.post('/:channelId/messages', upload.single('file'), createChannelMessage);

export default router;