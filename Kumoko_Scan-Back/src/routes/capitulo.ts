import { Router } from 'express';
import CapituloController from '../controllers/CapituloController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.get('/manga/:manga_id', CapituloController.listByManga);

router.post('/', authMiddleware, adminMiddleware, CapituloController.create);
router.put('/:id', authMiddleware, adminMiddleware, CapituloController.update);
router.delete('/:id', authMiddleware, adminMiddleware, CapituloController.delete);

export default router;