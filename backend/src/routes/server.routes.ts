import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { 
    getUserServers, 
    createServer, 
    getServer, 
    deleteServer,
    leaveServer,
    updateServer,
    getServerInvites,
    deleteServerInvite 
} from '../controllers/server.controller';

const router = Router();

router.use(authenticateToken);

// Rate limiter spécifique pour la création de serveurs
// Limite stricte: 10 serveurs par heure max
const createServerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 serveurs max par heure
  message: { error: 'Limite de création de serveur atteinte. Attendez 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Rate limit par ID utilisateur
    // On utilise 'unknown' comme fallback si user n'est pas défini (ne devrait pas arriver avec authenticateToken)
    return (req as any).user ? (req as any).user.userId : 'unknown';
  }
});

router.get('/', getUserServers);
router.post('/', createServerLimiter, upload.single('icon'), createServer);
router.get('/:serverId', getServer);
router.put('/:serverId', upload.single('icon'), updateServer);
router.delete('/:serverId', deleteServer);
router.post('/:serverId/leave', leaveServer);

router.get('/:serverId/invites', getServerInvites);
router.delete('/:serverId/invites/:inviteId', deleteServerInvite);

export default router;