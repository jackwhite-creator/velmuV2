import { Router } from 'express';
import { getFriendRequests, sendFriendRequest, updateFriendRequest, removeFriend } from '../controllers/friend.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/friends -> Lister
router.get('/', authenticateToken, getFriendRequests);

// POST /api/friends/request -> Envoyer
router.post('/request', authenticateToken, sendFriendRequest);

// 👇 C'EST CETTE LIGNE QUI MANQUAIT SÛREMENT 👇
// POST /api/friends/respond -> Accepter/Refuser
router.post('/respond', authenticateToken, updateFriendRequest);

// DELETE /api/friends/:requestId -> Supprimer
router.delete('/:requestId', authenticateToken, removeFriend);

export default router;