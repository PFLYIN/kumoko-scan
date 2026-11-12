import { Controller, Post, Body, Get, Param, Inject, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CriarMangaDto } from './criar-manga.dto';
import { CRIAR_MANGA_USE_CASE_PORT, CriarMangaUseCasePort } from '../../ports/inbound/criar-manga.use-case.port';
import { MangaRepositoryAdapter } from '../outbound/manga.repository.adapter';

@ApiTags('Mangas') // 🏷️ Documentação Swagger
@Controller('mangas')
export class MangaController {
  constructor(
    // 💉 Porta de Entrada para Criação (Hexagonal puro!)
    @Inject(CRIAR_MANGA_USE_CASE_PORT)
    private readonly criarMangaUseCase: CriarMangaUseCasePort,

    // 🛠️ Temporário: Injetando o banco direto só para testarmos a busca hoje.
    private readonly mangaRepository: MangaRepositoryAdapter,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova obra no acervo' })
  @ApiResponse({ status: 201, description: 'Obra registrada com sucesso.' })
  async criar(@Body() dto: CriarMangaDto) {
    const novaObra = await this.criarMangaUseCase.executar(dto.titulo, dto.autor, dto.capaUrl);
    
    return {
      message: 'Obra registrada com sucesso!',
      data: novaObra,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma obra pelo ID' })
  @ApiParam({ name: 'id', description: 'ID gerado ao criar o mangá' })
  @ApiResponse({ status: 200, description: 'Detalhes da obra encontrados.' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada.' })
  async buscarPorId(@Param('id') id: string) {
    // 🔍 Buscando no array em memória
    const manga = this.mangaRepository.buscarPorId(id);
    
    if (!manga) {
      throw new NotFoundException(`Nenhuma obra encontrada com o ID: ${id}`);
    }
    
    return manga;
  }
}