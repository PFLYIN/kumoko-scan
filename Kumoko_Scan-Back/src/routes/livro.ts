import { Router } from 'express';
import { uploadCover } from '../config/multer';
import LivroController from '../controllers/LivroController';
import { authMiddleware, adminMiddleware } from '../middlewares/auth'; // 🎯 Importado

const router = Router();

router.get('/', LivroController.list);
router.get('/:id', LivroController.getById);

router.post('/', authMiddleware, adminMiddleware, uploadCover.single('capa'), LivroController.create);
router.put('/:id', authMiddleware, adminMiddleware, LivroController.update);
router.delete('/:id', authMiddleware, adminMiddleware, LivroController.delete);

export default router;