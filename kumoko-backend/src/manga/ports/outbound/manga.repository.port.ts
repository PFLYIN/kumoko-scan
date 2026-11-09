import { Manga } from '../../domain/manga.entity';

// 🚪 PORTA DE SAÍDA: Contrato que o adaptador de banco de dados terá que seguir
export interface MangaRepositoryPort {
  salvar(manga: Manga): Promise<void>;
  buscarPorId(id: string): Promise<Manga | null>;
  buscarPorTitulo(titulo: string): Promise<Manga | null>;
}

// Essa constante é usada pelo NestJS para injeção de dependência
export const MANGA_REPOSITORY_PORT = Symbol('MANGA_REPOSITORY_PORT');