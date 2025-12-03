import { Router } from 'express';
import * as botController from '../controllers/bot.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté (en tant qu'utilisateur humain)
router.use(authenticateToken);

router.post('/', botController.createBot);
router.get('/', botController.getMyBots);
router.post('/:id/token', botController.regenerateToken);
router.post('/:id/invite', botController.addToServer);
router.patch('/:id', botController.updateBot);
router.delete('/:id', botController.deleteBot);
router.get('/:id/preview', botController.getBotPreview);

export default router;
