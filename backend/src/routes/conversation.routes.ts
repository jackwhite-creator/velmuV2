import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
// 👇 Nouveaux imports pour les messages privés (DMs)
import { getDirectMessages, createDirectMessage } from '../controllers/direct-message.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// On sécurise toutes les routes de ce fichier
router.use(authenticateToken);

// --- Gestion des Conversations ---
// Créer ou récupérer une conv existante
router.post('/', ConversationController.getOrCreate);
// Liste des conversations (Barre latérale gauche)
router.get('/me', ConversationController.getMyConversations);

// --- Gestion des Messages Privés (Chat) ---
router.get('/:conversationId/messages', getDirectMessages);
router.post('/:conversationId/messages', upload.single('file'), createDirectMessage);

export default router;