import { Router } from 'express';
import CompraController from '../controllers/CompraController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/finalizar', authMiddleware, CompraController.finalizar);
router.get('/historico', authMiddleware, CompraController.historico);

export default router;