import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import fs from 'fs';

// ✅ REQUISITO: Validando extensão de arquivos
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    // Rejeita silenciosamente no Multer, o Express vai capturar o erro
    cb(new Error(`Extensão inválida. Apenas PNG, JPG, JPEG e WEBP são aceitos.`));
  }
};

const storageCover = multer.diskStorage({
  destination: (req, file, cb) => {
    const destPath = path.resolve(__dirname, '..', '..', 'uploads', 'covers');
    fs.mkdirSync(destPath, { recursive: true });
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // ✅ REQUISITO: Evitando colisão de nomes (Hash único + Timestamp)
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err, file.originalname);
      const fileName = `cover-${hash.toString('hex')}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`;
      cb(null, fileName);
    });
  }
});

// ✅ REQUISITO: Tamanho máximo do arquivo (5MB) e recebimento da imagem
export const uploadCover = multer({ 
  storage: storageCover, 
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes
  }
});