import { Router } from 'express';
import NovelController from '../controllers/NovelController';
import { uploadCover } from '../config/multer'; 
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.get('/', NovelController.index);
router.post('/', authMiddleware, adminMiddleware, uploadCover.single('capa'), NovelController.store);

export default router;