import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CriarMangaUseCasePort } from '../ports/inbound/criar-manga.use-case.port';
import { MangaRepositoryPort, MANGA_REPOSITORY_PORT } from '../ports/outbound/manga.repository.port';
import { Manga } from '../domain/manga.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CriarMangaService implements CriarMangaUseCasePort {
  constructor(
    // 💉 Injeção de Dependência: O NestJS injeta o banco de dados aqui usando o contrato (Port)
    @Inject(MANGA_REPOSITORY_PORT)
    private readonly mangaRepository: MangaRepositoryPort,
  ) {}

  async executar(titulo: string, autor: string, capaUrl: string): Promise<Manga> {
    // 1. Regra de negócio: Valida se a obra já existe usando a porta de saída
    const mangaExistente = await this.mangaRepository.buscarPorTitulo(titulo);
    if (mangaExistente) {
      throw new BadRequestException(`A obra '${titulo}' já está registrada no acervo.`);
    }

    // 2. Instancia a Entidade Pura de Domínio
    const id = randomUUID(); // Gera um ID único nativo do Node
    const novoManga = new Manga(id, titulo, autor, capaUrl, true);

    // 3. Persiste os dados (O service não sabe se é MariaDB ou Postgres, ele só confia no Port)
    await this.mangaRepository.salvar(novoManga);

    return novoManga;
  }
}