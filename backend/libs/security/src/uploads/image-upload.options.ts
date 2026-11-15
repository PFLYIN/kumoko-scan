import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import type { Request } from 'express';
import { extname } from 'node:path';
import { memoryStorage } from 'multer';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const INVALID_IMAGE_FORMAT_MESSAGE = 'Formato de imagem inválido. Envie JPG, PNG ou WEBP.';

export interface ImageUploadOptions {
  /** Tamanho maximo por arquivo, em MB (padrao 5). */
  maxSizeMb?: number;
  /** Quantidade maxima de arquivos por requisicao (padrao 1). */
  maxFiles?: number;
}

/**
 * Opcoes do multer para upload de imagem em memoria (o service valida magic bytes e grava em disco).
 * Uso: `@UseInterceptors(FileInterceptor('capa', createImageUploadOptions({ maxSizeMb: 5 })))`.
 */
export function createImageUploadOptions(options: ImageUploadOptions = {}): MulterOptions {
  const maxSizeMb = options.maxSizeMb ?? 5;
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxSizeMb * 1024 * 1024,
      files: options.maxFiles ?? 1,
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const ext = extname(file.originalname ?? '').toLowerCase();
      const mimeOk = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype);
      const extOk = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
      if (!mimeOk || !extOk) {
        callback(new BadRequestException(INVALID_IMAGE_FORMAT_MESSAGE), false);
        return;
      }
      callback(null, true);
    },
  };
}
