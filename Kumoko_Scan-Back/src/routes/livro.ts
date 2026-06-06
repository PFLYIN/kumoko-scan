import { Router } from 'express';
import { uploadCover } from '../config/multer';
import LivroController from '../controllers/LivroController';

const router = Router();

router.post('/', uploadCover.single('cover_image'), LivroController.create);
router.get('/', LivroController.list);

export default router;