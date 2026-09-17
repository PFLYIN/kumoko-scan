import { Router } from 'express';
import NovelController from '../controllers/NovelController';
import { uploadCover } from '../config/multer'; 
import { authMiddleware, adminMiddleware } from '../middlewares/auth'; // 🎯 Importado

const router = Router();

router.get('/', NovelController.index);
router.post('/', authMiddleware, adminMiddleware, uploadCover.single('capa'), NovelController.store);

export default router;