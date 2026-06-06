import { Router } from 'express';
import { uploadPages } from '../config/multer'; 
import UploadController from '../controllers/UploadController';

const router = Router();

router.post('/page/:manga_id/:capitulo_id/:numero_pagina', uploadPages.single('page_image'), UploadController.page);
router.get('/page/:capitulo_id', UploadController.getPaginaPorCapitulo);

export default router;