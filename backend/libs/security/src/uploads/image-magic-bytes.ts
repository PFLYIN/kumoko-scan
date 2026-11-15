import { BadRequestException } from '@nestjs/common';

export type ImageExtension = 'jpg' | 'png' | 'webp';

export interface DetectedImage {
  ext: ImageExtension;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
}

export const INVALID_IMAGE_MESSAGE = 'O arquivo enviado não é uma imagem válida (JPG, PNG ou WEBP).';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) {
    return false;
  }
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

/** Detecta o formato real pelos primeiros bytes; retorna null se nao for jpg/png/webp. */
export function detectImageType(buffer: Buffer | undefined | null): DetectedImage | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (startsWith(buffer, PNG_SIGNATURE)) {
    return { ext: 'png', mime: 'image/png' };
  }
  // WEBP: "RIFF" + 4 bytes de tamanho + "WEBP"
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

/**
 * Garante que o conteudo e mesmo uma imagem (nao confia em mimetype/extensao enviados pelo cliente).
 * Lanca 400 se nao for. Retorna o tipo detectado para gerar o nome do arquivo.
 */
export function assertImageMagicBytes(buffer: Buffer | undefined | null): DetectedImage {
  const detected = detectImageType(buffer);
  if (!detected) {
    throw new BadRequestException(INVALID_IMAGE_MESSAGE);
  }
  return detected;
}
