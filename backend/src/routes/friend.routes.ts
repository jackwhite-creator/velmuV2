import { Router } from 'express';
import { FriendController } from '../controllers/friend.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/friends -> Lister
router.get('/', authenticateToken, FriendController.getAll);

// POST /api/friends/request -> Envoyer
router.post('/request', authenticateToken, FriendController.sendRequest);

// 👇 C'EST CETTE LIGNE QUI MANQUAIT SÛREMENT 👇
// POST /api/friends/respond -> Accepter/Refuser
router.post('/respond', authenticateToken, FriendController.respond);

// DELETE /api/friends/:requestId -> Supprimer
router.delete('/:requestId', authenticateToken, FriendController.delete);

export default router;