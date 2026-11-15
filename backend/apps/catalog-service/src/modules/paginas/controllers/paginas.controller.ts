import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
  ApiResponse,
  ApiTags,
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
import { CreatePaginaDto, PaginaResponseDto, ReordenarPaginasDto } from '../dto/pagina.dto';
import { PaginasService } from '../services/paginas.service';

@ApiTags('paginas')
@Controller()
export class PaginasController {
  constructor(private readonly paginas: PaginasService) {}

  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get('capitulos/:id/paginas')
  @ApiOperation({ summary: 'Lista as paginas de um capitulo em ordem (cache)' })
  @ApiOkResponse({
    type: [PaginaResponseDto],
    headers: { 'X-Cache': { description: 'HIT ou MISS', schema: { type: 'string' } } },
  })
  @ApiResponse({ status: 404, description: 'Capitulo nao encontrado', type: ErrorResponseDto })
  async list(@Param('id', ParseIdPipe) capituloId: number, @Res({ passthrough: true }) res: Response) {
    const result = await this.paginas.listByCapitulo(capituloId);
    setCacheHeader(res, result.hit);
    return result.value;
  }

  @Roles('admin')
  @Post('capitulos/:id/paginas')
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @UseInterceptors(FileInterceptor('imagem', createImageUploadOptions({ maxSizeMb: 5 })))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: {
        imagem: { type: 'string', format: 'binary', description: 'JPG, PNG ou WEBP, até 5 MB' },
        numero: { type: 'integer', minimum: 1, description: 'Padrao: proximo numero livre' },
      },
    },
  })
  @ApiOperation({ summary: 'Envia uma pagina (admin)' })
  @ApiResponse({ status: 201, type: PaginaResponseDto })
  @ApiResponse({ status: 400, description: 'Imagem ausente ou invalida', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Capitulo nao encontrado', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Numero de pagina duplicado', type: ErrorResponseDto })
  create(
    @Param('id', ParseIdPipe) capituloId: number,
    @Body() dto: CreatePaginaDto,
    @UploadedFile() imagem?: Express.Multer.File,
  ): Promise<PaginaResponseDto> {
    return this.paginas.create(capituloId, dto, imagem);
  }

  @Roles('admin')
  @Put('capitulos/:id/paginas/ordem')
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({
    summary: 'Reordena as paginas de um capitulo (admin)',
    description:
      'paginaIds deve conter exatamente todas as paginas do capitulo; numero passa a ser 1..N na ordem enviada. ' +
      'Invalida os caches de paginas e de capitulos.',
  })
  @ApiOkResponse({ type: [PaginaResponseDto], description: 'Paginas na nova ordem' })
  @ApiResponse({ status: 400, description: 'Lista invalida, incompleta ou com repeticoes', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Capitulo nao encontrado', type: ErrorResponseDto })
  reordenar(
    @Param('id', ParseIdPipe) capituloId: number,
    @Body() dto: ReordenarPaginasDto,
  ): Promise<PaginaResponseDto[]> {
    return this.paginas.reordenar(capituloId, dto);
  }

  @Roles('admin')
  @Delete('paginas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Exclui uma pagina e seu arquivo (admin)' })
  @ApiResponse({ status: 204, description: 'Excluida' })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Pagina nao encontrada', type: ErrorResponseDto })
  async remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.paginas.remove(id);
  }
}
