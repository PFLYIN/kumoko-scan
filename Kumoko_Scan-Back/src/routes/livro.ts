import { Router } from 'express';
import { uploadCover } from '../config/multer';
import LivroController from '../controllers/LivroController';
import { authMiddleware } from '../middlewares/auth'; // 🎯 Adicionado proteção

const router = Router();

// 🎯 CORREÇÃO: Trocado 'cover_image' por 'capa' para bater com o Mobile
router.post('/', authMiddleware, uploadCover.single('capa'), LivroController.create);
router.get('/', LivroController.list);

router.put('/:id', authMiddleware, LivroController.update);
router.delete('/:id', authMiddleware, LivroController.delete);
router.get('/:id', LivroController.getById);

export default router;