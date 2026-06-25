import { Router } from 'express';
import MangaController from '../controllers/MangaController';
import { authMiddleware } from '../middlewares/auth';
import { uploadCover } from '../config/multer'; 

const router = Router();

// 🎯 UNIFICADO: Protegido por token e pronto para receber o arquivo "capa" vindo do React
router.post('/', authMiddleware, uploadCover.single('capa'), MangaController.create);

router.get('/', MangaController.list);
router.get('/:id', MangaController.getById);
router.put('/:id', authMiddleware, MangaController.update);
router.delete('/:id', authMiddleware, MangaController.delete);

export default router;