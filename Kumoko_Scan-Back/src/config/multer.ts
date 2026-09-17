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
    cb(new Error(`Extensão inválida. Apenas PNG, JPG, JPEG e WEBP são aceitos.`));
  }
};

// 1. Storage das Capas
const storageCover = multer.diskStorage({
  destination: (req, file, cb) => {
    const destPath = path.resolve(__dirname, '..', '..', 'uploads', 'covers');
    fs.mkdirSync(destPath, { recursive: true });
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err, file.originalname);
      const fileName = `cover-${hash.toString('hex')}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`;
      cb(null, fileName);
    });
  }
});

// 2. Storage das Páginas dos Capítulos (O que estava faltando!)
const storagePages = multer.diskStorage({
  destination: (req, file, cb) => {
    let manga_id = req.params.manga_id;
    let capitulo_id = req.params.capitulo_id;

    if (!manga_id || !capitulo_id) {
      const urlParts = req.originalUrl.split('/');
      manga_id = urlParts[3];    
      capitulo_id = urlParts[4];
    }

    if (!manga_id || !capitulo_id) {
      return cb(new Error('ID do mangá ou do capítulo não fornecido!'), '');
    }

    const destPath = path.resolve(__dirname, '..', '..', 'uploads', 'pages', `manga_${manga_id}`, `capitulo_${capitulo_id}`);
    fs.mkdirSync(destPath, { recursive: true });
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err, file.originalname);
      
      let numero_pagina = req.params.numero_pagina;
      if (!numero_pagina) {
          const urlParts = req.originalUrl.split('/');
          numero_pagina = urlParts[5];
      }

      const fileName = `page-${numero_pagina || hash.toString('hex')}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`;
      cb(null, fileName);
    });
  }
});

// ✅ Exportando ambos com limite de 5MB
const limitesDeTamanho = { fileSize: 5 * 1024 * 1024 }; // 5 Megabytes

export const uploadCover = multer({ storage: storageCover, fileFilter: imageFileFilter, limits: limitesDeTamanho });
export const uploadPages = multer({ storage: storagePages, fileFilter: imageFileFilter, limits: limitesDeTamanho });