import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { setCacheHeader } from '@kumoko/cache';
import {
  AUTH_COOKIE_NAME,
  createImageUploadOptions,
  Public,
  PUBLIC_READ_THROTTLE,
  Roles,
  Throttle,
} from '@kumoko/security';
import type { Response } from 'express';
import { ErrorResponseDto } from '../../../shared/dto/error-response.dto';
import { ParseIdPipe } from '../../../shared/http/parse-id.pipe';
import { CAPA_FILE_SCHEMA, CreateObraDto } from '../dto/create-obra.dto';
import { ListObrasQueryDto } from '../dto/list-obras-query.dto';
import { ObraResponseDto, PaginatedObrasResponseDto } from '../dto/obra-response.dto';
import { UpdateObraDto } from '../dto/update-obra.dto';
import {
  GeneroContagemDto,
  RELACIONADAS_LIMIT_PADRAO,
  RelacionadasQueryDto,
} from '../dto/relacionadas-query.dto';
import { LOTE_MAX_IDS } from '../domain/lote-ids';
import { ObrasService } from '../services/obras.service';

const CACHE_HEADER_DOC = {
  'X-Cache': { description: 'HIT ou MISS (cache-aside no Redis)', schema: { type: 'string' } },
};

@ApiTags('obras')
@ApiExtraModels(CreateObraDto, UpdateObraDto)
@Controller('obras')
export class ObrasController {
  constructor(private readonly obras: ObrasService) {}

  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get()
  @ApiOperation({ summary: 'Lista obras com filtros, busca, ordenacao e paginacao (cache)' })
  @ApiOkResponse({ type: PaginatedObrasResponseDto, headers: CACHE_HEADER_DOC })
  @ApiResponse({ status: 400, description: 'Filtros invalidos', type: ErrorResponseDto })
  async list(@Query() query: ListObrasQueryDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.obras.list(query);
    setCacheHeader(res, result.hit);
    return result.value;
  }

  // Declarada ANTES de :id para "generos" nao ser interpretado como id.
  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get('generos')
  @ApiOperation({ summary: 'Gêneros em uso com a quantidade de obras, do mais comum ao menos (cache)' })
  @ApiOkResponse({ type: [GeneroContagemDto], headers: CACHE_HEADER_DOC })
  async generos(@Res({ passthrough: true }) res: Response) {
    const result = await this.obras.listarGeneros();
    setCacheHeader(res, result.hit);
    return result.value;
  }

  // Declarada ANTES de :id para "lote" nao ser interpretado como id.
  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get('lote')
  @ApiOperation({
    summary: `Busca varias obras por id (maximo ${LOTE_MAX_IDS}); ids inexistentes sao ignorados`,
  })
  @ApiQuery({ name: 'ids', example: '1,2,3', description: 'Ids separados por virgula' })
  @ApiOkResponse({ type: [ObraResponseDto] })
  @ApiResponse({
    status: 400,
    description: 'Ids ausentes, invalidos ou acima do limite',
    type: ErrorResponseDto,
  })
  lote(@Query('ids') ids: string): Promise<ObraResponseDto[]> {
    return this.obras.findLote(ids);
  }

  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de uma obra (cache)' })
  @ApiOkResponse({ type: ObraResponseDto, headers: CACHE_HEADER_DOC })
  @ApiResponse({ status: 400, description: 'Id invalido', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Obra nao encontrada', type: ErrorResponseDto })
  async findOne(@Param('id', ParseIdPipe) id: number, @Res({ passthrough: true }) res: Response) {
    const result = await this.obras.findById(id);
    setCacheHeader(res, result.hit);
    return result.value;
  }

  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get(':id/relacionadas')
  @ApiOperation({
    summary: 'Obras relacionadas: gêneros em comum e mesmo tipo, desempate por vendas (cache)',
  })
  @ApiOkResponse({ type: [ObraResponseDto], headers: CACHE_HEADER_DOC })
  @ApiResponse({ status: 400, description: 'Id ou limit invalido', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Obra nao encontrada', type: ErrorResponseDto })
  async relacionadas(
    @Param('id', ParseIdPipe) id: number,
    @Query() query: RelacionadasQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.obras.findRelacionadas(id, query.limit ?? RELACIONADAS_LIMIT_PADRAO);
    setCacheHeader(res, result.hit);
    return result.value;
  }

  @Roles('admin')
  @Post()
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @UseInterceptors(FileInterceptor('capa', createImageUploadOptions({ maxSizeMb: 5 })))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateObraDto) },
        { type: 'object', properties: { capa: CAPA_FILE_SCHEMA } },
      ],
    },
  })
  @ApiOperation({ summary: 'Cria obra (admin), com capa opcional' })
  @ApiResponse({ status: 201, type: ObraResponseDto })
  @ApiResponse({ status: 400, description: 'Dados ou imagem invalidos', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  create(@Body() dto: CreateObraDto, @UploadedFile() capa?: Express.Multer.File): Promise<ObraResponseDto> {
    return this.obras.create(dto, capa);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @UseInterceptors(FileInterceptor('capa', createImageUploadOptions({ maxSizeMb: 5 })))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateObraDto) },
        { type: 'object', properties: { capa: CAPA_FILE_SCHEMA } },
      ],
    },
  })
  @ApiOperation({ summary: 'Atualiza obra (admin); nova capa substitui e apaga a antiga' })
  @ApiOkResponse({ type: ObraResponseDto })
  @ApiResponse({ status: 400, description: 'Dados ou imagem invalidos', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Obra nao encontrada', type: ErrorResponseDto })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateObraDto,
    @UploadedFile() capa?: Express.Multer.File,
  ): Promise<ObraResponseDto> {
    return this.obras.update(id, dto, capa);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Exclui obra (admin), sua capa e a pasta de paginas' })
  @ApiResponse({ status: 204, description: 'Excluida' })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Obra nao encontrada', type: ErrorResponseDto })
  async remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.obras.remove(id);
  }
}
