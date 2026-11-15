import { Injectable, Logger } from '@nestjs/common';
import { assertImageMagicBytes, generateSafeFileName } from '@kumoko/security';
import { copyFile, mkdir, rm, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { CatalogSettings } from '../../config/catalog-settings';
import { toPosixRelative } from './public-url';

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Armazenamento de arquivos em UPLOADS_DIR. Toda operacao resolve o caminho e confere que ele
 * fica DENTRO da raiz (protecao contra path traversal). Remocoes nunca lancam: falhas viram warn.
 */
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly root: string;

  constructor(settings: CatalogSettings) {
    this.root = resolve(settings.uploadsDir);
  }

  get rootDir(): string {
    return this.root;
  }

  /**
   * Valida os magic bytes (400 se nao for imagem), gera nome seguro e grava em `<dir>/<nome>`.
   * Retorna o caminho relativo com '/' (ex.: `covers/1731-uuid.jpg`).
   */
  async saveImage(relativeDir: string, buffer: Buffer): Promise<string> {
    const { ext } = assertImageMagicBytes(buffer);
    const relativePath = `${toPosixRelative(relativeDir)}/${generateSafeFileName(ext)}`;
    const absolute = this.resolveInside(relativePath);
    if (!absolute) {
      throw new Error(`Caminho de upload fora de UPLOADS_DIR: ${relativeDir}`);
    }
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, buffer, { flag: 'wx' });
    this.logger.log(`Arquivo salvo path=${relativePath} bytes=${buffer.length}`);
    return relativePath;
  }

  /** Copia um arquivo externo (ex.: capa do seed) para `<dir>/<nome seguro>`; retorna o caminho relativo. */
  async importFile(sourceAbsolutePath: string, relativeDir: string, ext: string): Promise<string> {
    const relativePath = `${toPosixRelative(relativeDir)}/${generateSafeFileName(ext)}`;
    const absolute = this.resolveInside(relativePath);
    if (!absolute) {
      throw new Error(`Caminho de destino fora de UPLOADS_DIR: ${relativeDir}`);
    }
    await mkdir(dirname(absolute), { recursive: true });
    await copyFile(sourceAbsolutePath, absolute);
    return relativePath;
  }

  /** Remove um arquivo (se existir). Ignora caminhos fora da raiz e nunca lanca. */
  async removeFile(relativePath: string | null | undefined): Promise<boolean> {
    if (!relativePath) {
      return false;
    }
    const absolute = this.resolveInside(relativePath);
    if (!absolute) {
      this.logger.warn(`Remocao recusada: caminho fora de UPLOADS_DIR path=${relativePath}`);
      return false;
    }
    try {
      await unlink(absolute);
      this.logger.log(`Arquivo removido path=${toPosixRelative(relativePath)}`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Falha ao remover arquivo path=${relativePath} erro=${describeError(error)}`);
      }
      return false;
    }
  }

  /** Remove uma pasta inteira (recursivo). Nunca remove a propria raiz; nunca lanca. */
  async removeDir(relativeDir: string): Promise<boolean> {
    const absolute = this.resolveInside(relativeDir);
    if (!absolute) {
      this.logger.warn(`Remocao de pasta recusada: fora de UPLOADS_DIR path=${relativeDir}`);
      return false;
    }
    try {
      await rm(absolute, { recursive: true, force: true });
      this.logger.log(`Pasta removida path=${toPosixRelative(relativeDir)}`);
      return true;
    } catch (error) {
      this.logger.warn(`Falha ao remover pasta path=${relativeDir} erro=${describeError(error)}`);
      return false;
    }
  }

  /** Caminho absoluto se estiver estritamente dentro de UPLOADS_DIR; caso contrario null. */
  resolveInside(relativePath: string): string | null {
    const absolute = resolve(this.root, toPosixRelative(relativePath));
    return absolute.startsWith(this.root + sep) ? absolute : null;
  }
}
