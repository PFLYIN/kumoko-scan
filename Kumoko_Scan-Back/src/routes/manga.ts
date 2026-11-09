import { Router } from 'express';
import MangaController from '../controllers/MangaController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';
import { uploadCover } from '../config/multer'; 

const router = Router();

router.get('/', MangaController.list);
router.get('/:id', MangaController.getById);

router.post('/', authMiddleware, adminMiddleware, uploadCover.single('capa'), MangaController.create);
router.put('/:id', authMiddleware, adminMiddleware, MangaController.update);
router.delete('/:id', authMiddleware, adminMiddleware, MangaController.delete);

export default router;