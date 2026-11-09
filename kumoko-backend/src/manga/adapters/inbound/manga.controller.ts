import { Controller, Post, Body, Get, Param, Inject } from '@nestjs/common';
import { CriarMangaDto } from './criar-manga.dto';
import { CRIAR_MANGA_USE_CASE_PORT, CriarMangaUseCasePort } from '../../ports/inbound/criar-manga.use-case.port';

// 🌐 ROTA PRINCIPAL: localhost:3000/mangas
@Controller('mangas')
export class MangaController {
  constructor(
    // 💉 Injeção de Dependência: O Controller não sabe como o service funciona por dentro,
    // ele só conversa com a "Porta de Entrada" (Contrato).
    @Inject(CRIAR_MANGA_USE_CASE_PORT)
    private readonly criarMangaUseCase: CriarMangaUseCasePort,
  ) {}

  // 📝 API 1: Criar nova obra no acervo (POST /mangas)
  @Post()
  async criar(@Body() dto: CriarMangaDto) {
    // Repassa para o Caso de Uso
    const novaObra = await this.criarMangaUseCase.executar(dto.titulo, dto.autor, dto.capaUrl);
    
    return {
      message: 'Obra registrada com sucesso!',
      data: novaObra,
    };
  }

  // 🔍 API 2: Buscar obra por ID (GET /mangas/:id) - Igual os professores fizeram!
  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    // Deixando a rota pronta para quando criarmos o Use Case de busca
    return {
      message: `Buscando os detalhes da obra com ID: ${id}`,
      // manga: await this.buscarMangaUseCase.executar(id)
    };
  }
}