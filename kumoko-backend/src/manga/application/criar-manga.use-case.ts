import { Inject, Injectable } from '@nestjs/common';
import { CriarMangaUseCasePort } from '../ports/inbound/criar-manga.use-case.port';
import { Manga } from '../domain/manga.entity';
import { MANGA_REPOSITORY_PORT, MangaRepositoryPort } from '../ports/outbound/manga.repository.port';

@Injectable()
export class CriarMangaUseCase implements CriarMangaUseCasePort {
  constructor(
    // 💉 Injetamos a Porta de Saída (o contrato do banco) em vez do Adapter direto
    @Inject(MANGA_REPOSITORY_PORT)
    private readonly mangaRepository: MangaRepositoryPort,
  ) {}

  async executar(titulo: string, autor: string, capaUrl: string): Promise<Manga> {
    // 1. Cria a entidade usando a Regra de Negócio do Domínio
    const novoManga = new Manga(titulo, autor, capaUrl);

    // 2. Salva no banco de dados através da Porta
    this.mangaRepository.salvar(novoManga);

    return novoManga;
  }
}