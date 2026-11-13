import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto'; 
import { CriarMangaUseCasePort } from '../ports/inbound/criar-manga.use-case.port';
import { Manga } from '../domain/manga.entity';
import { MANGA_REPOSITORY_PORT, MangaRepositoryPort } from '../ports/outbound/manga.repository.port';

@Injectable()
export class CriarMangaUseCase implements CriarMangaUseCasePort {
  constructor(
    @Inject(MANGA_REPOSITORY_PORT)
    private readonly mangaRepository: MangaRepositoryPort,
  ) {}

  async executar(titulo: string, autor: string, capaUrl: string): Promise<Manga> {
    // 1. Geramos o ID único da Obra
    const id = randomUUID();

    // 2. Passamos os 5 parâmetros exatos: id, titulo, autor, capaUrl e ativo (true)
    const novoManga = new Manga(id, titulo, autor, capaUrl, true);

    // 3. Salva no banco de dados temporário
    this.mangaRepository.salvar(novoManga);

    return novoManga;
  }
}