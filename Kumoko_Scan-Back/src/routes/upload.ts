import { Router } from 'express';
import { uploadPages } from '../config/multer'; 
import UploadController from '../controllers/UploadController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.get('/page/:capitulo_id', UploadController.getPaginaPorCapitulo);

router.post('/page/:manga_id/:capitulo_id/:numero_pagina', authMiddleware, adminMiddleware, uploadPages.single('page_image'), UploadController.page);

export default router;