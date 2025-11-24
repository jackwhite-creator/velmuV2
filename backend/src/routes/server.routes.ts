import { Router } from 'express';
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
    deleteServerInvite // ✅ Import
} from '../controllers/server.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserServers);
router.post('/', upload.single('icon'), createServer);
router.get('/:serverId', getServer);
router.put('/:serverId', upload.single('icon'), updateServer);
router.delete('/:serverId', deleteServer);
router.post('/:serverId/leave', leaveServer);

router.get('/:serverId/invites', getServerInvites);
// ✅ ROUTE SUPPRESSION
router.delete('/:serverId/invites/:inviteId', deleteServerInvite);

export default router;