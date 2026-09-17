import { Router } from 'express';
import { uploadPages } from '../config/multer'; 
import UploadController from '../controllers/UploadController';
import { authMiddleware, adminMiddleware } from '../middlewares/auth'; // 🎯 Importado

const router = Router();

// 🟢 Público: Leitura da página
router.get('/page/:capitulo_id', UploadController.getPaginaPorCapitulo);

// 🔴 Fechado: Apenas o Mestre das Sombras pode fazer o upload da imagem
router.post('/page/:manga_id/:capitulo_id/:numero_pagina', authMiddleware, adminMiddleware, uploadPages.single('page_image'), UploadController.page);

export default router;