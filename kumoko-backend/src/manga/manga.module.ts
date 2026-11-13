import { Module } from '@nestjs/common';
import { MangaController } from './adapters/inbound/manga.controller';
import { CriarMangaUseCase } from './application/criar-manga.use-case';
import { CRIAR_MANGA_USE_CASE_PORT } from './ports/inbound/criar-manga.use-case.port';
import { MangaRepositoryAdapter } from './adapters/outbound/manga.repository.adapter';
import { MANGA_REPOSITORY_PORT } from './ports/outbound/manga.repository.port';

@Module({
  controllers: [MangaController],
  providers: [
    MangaRepositoryAdapter, // Instância principal do banco em memória
    {
      provide: CRIAR_MANGA_USE_CASE_PORT,
      useClass: CriarMangaUseCase,
    },
    {
      provide: MANGA_REPOSITORY_PORT,
      useExisting: MangaRepositoryAdapter, // 👈 O segredo está aqui! Usamos a mesma instância já criada.
    }
  ],
})
export class MangaModule {}