import { Router } from 'express';
import NovelController from '../controllers/NovelController';
import { uploadCover } from '../config/multer'; // 🎯 Adicionado upload
import { authMiddleware } from '../middlewares/auth'; // 🎯 Adicionado proteção

const router = Router();

router.get('/', NovelController.index);
// 🎯 CORREÇÃO: Plugar o middleware de imagem e autenticação
router.post('/', authMiddleware, uploadCover.single('capa'), NovelController.store);

export default router;