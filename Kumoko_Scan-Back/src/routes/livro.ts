import { Router } from 'express';
import { uploadCover } from '../config/multer';
import LivroController from '../controllers/LivroController';

const router = Router();

router.post('/', uploadCover.single('cover_image'), LivroController.create);
router.get('/', LivroController.list);

// 🎯 As duas rotas novas para fechar o CRUD Completo
router.put('/:id', LivroController.update);
router.delete('/:id', LivroController.delete);
router.get('/:id', LivroController.getById);

export default router;