import { Module } from '@nestjs/common';
import { MangaController } from './adapters/inbound/manga.controller';
import { CriarMangaService } from './services/criar-manga.service';
import { MangaRepositoryAdapter } from './adapters/outbound/manga.repository.adapter';
import { CRIAR_MANGA_USE_CASE_PORT } from './ports/inbound/criar-manga.use-case.port';
import { MANGA_REPOSITORY_PORT } from './ports/outbound/manga.repository.port';

@Module({
  controllers: [MangaController],
  providers: [
    // 🔗 Injeção de Dependência 1: Conectando a Porta de Entrada ao Serviço
    {
      provide: CRIAR_MANGA_USE_CASE_PORT,
      useClass: CriarMangaService,
    },
    // 🔗 Injeção de Dependência 2: Conectando a Porta de Saída ao Repositório
    {
      provide: MANGA_REPOSITORY_PORT,
      useClass: MangaRepositoryAdapter,
    },
  ],
})
export class MangaModule {}
