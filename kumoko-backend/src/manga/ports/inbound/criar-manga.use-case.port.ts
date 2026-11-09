import { Manga } from '../../domain/manga.entity';

// 🚪 PORTA DE ENTRADA: Contrato do que a nossa aplicação sabe fazer
export interface CriarMangaUseCasePort {
  executar(titulo: string, autor: string, capaUrl: string): Promise<Manga>;
}

export const CRIAR_MANGA_USE_CASE_PORT = Symbol('CRIAR_MANGA_USE_CASE_PORT');