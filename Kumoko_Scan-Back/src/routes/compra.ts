import { Router } from 'express';
import CompraController from '../controllers/CompraController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Ambas precisam estar logado para funcionar
router.post('/finalizar', authMiddleware, CompraController.finalizar);
router.get('/historico', authMiddleware, CompraController.historico);

export default router;