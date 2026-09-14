import { Router } from 'express';
import CompraController from '../controllers/CompraController';
import { authMiddleware } from '../middlewares/auth'; // 🎯 Adicionado proteção

const router = Router();

// 🎯 CORREÇÃO: Só quem está logado pode comprar
router.post('/finalizar', authMiddleware, CompraController.finalizar);

export default router;