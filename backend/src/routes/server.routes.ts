import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { 
    getUserServers, 
    createServer, 
    getServer, 
    deleteServer,
    leaveServer,
    updateServer 
} from '../controllers/server.controller'; // 👈 On importe les noms exacts

const router = Router();

// Toutes les routes serveurs nécessitent d'être connecté
router.use(authenticateToken);

// GET /api/servers/ -> Récupérer la liste de mes serveurs (Sidebar)
router.get('/', getUserServers);

// POST /api/servers/ -> Créer un serveur
router.post('/', createServer);

// GET /api/servers/:serverId -> Récupérer les détails d'un serveur (Channels, Membres...)
router.get('/:serverId', getServer);

router.put('/:serverId', updateServer);


// DELETE /api/servers/:serverId -> Supprimer un serveur
router.delete('/:serverId', deleteServer);

// POST /api/servers/:serverId/leave -> Quitter un serveur
router.post('/:serverId/leave', leaveServer);


export default router;