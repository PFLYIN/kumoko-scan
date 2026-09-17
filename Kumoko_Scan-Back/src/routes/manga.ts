import { Router } from 'express';
import MangaController from '../controllers/MangaController';
import { authMiddleware, adminMiddleware } from '../middlewares/auth'; // 🎯 Importado
import { uploadCover } from '../config/multer'; 

const router = Router();

router.get('/', MangaController.list);
router.get('/:id', MangaController.getById);

// 🎯 TRAVA DUPLA: Tem que estar logado (auth) E ser admin (admin)
router.post('/', authMiddleware, adminMiddleware, uploadCover.single('capa'), MangaController.create);
router.put('/:id', authMiddleware, adminMiddleware, MangaController.update);
router.delete('/:id', authMiddleware, adminMiddleware, MangaController.delete);

export default router;