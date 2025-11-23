import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateToken, CategoryController.create);
router.put('/reorder', authenticateToken, CategoryController.reorder); // <--- NOUVEAU
router.put('/:categoryId', authenticateToken, CategoryController.update);
router.delete('/:categoryId', authenticateToken, CategoryController.delete);

export default router;