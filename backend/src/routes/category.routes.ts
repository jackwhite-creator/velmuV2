import { Router } from 'express';
import { createCategory, updateCategory, deleteCategory, reorderCategories } from '../controllers/category.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createCategory);
router.put('/reorder', reorderCategories);
router.put('/:categoryId', updateCategory);
router.delete('/:categoryId', deleteCategory);

export default router;