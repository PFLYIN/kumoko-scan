import { Router } from 'express';
import MangaController from '../controllers/MangaController';
import { authMiddleware } from '../middlewares/auth';
import { uploadCover } from '../config/multer'; 

const router = Router();

router.post('/', uploadCover.single('cover_image'), MangaController.create);

router.get('/', MangaController.list);
router.put('/:id', MangaController.update);
router.delete('/:id', MangaController.delete);

router.post('/', authMiddleware, MangaController.create);

export default router;