import { Router } from 'express';
import CapituloController from '../controllers/CapituloController';
import { authMiddleware, adminMiddleware } from '../middlewares/auth'; // 🎯 Importado

const router = Router();

// 🟢 Público: Aplicativo pode buscar os capítulos do mangá
router.get('/manga/:manga_id', CapituloController.listByManga);

// 🔴 Fechado: Apenas o Mestre das Sombras pode criar, editar ou deletar
router.post('/', authMiddleware, adminMiddleware, CapituloController.create);
router.put('/:id', authMiddleware, adminMiddleware, CapituloController.update);
router.delete('/:id', authMiddleware, adminMiddleware, CapituloController.delete);

export default router;