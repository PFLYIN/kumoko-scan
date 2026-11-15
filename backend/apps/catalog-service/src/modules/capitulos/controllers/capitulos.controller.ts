import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { setCacheHeader } from '@kumoko/cache';
import { AUTH_COOKIE_NAME, Public, PUBLIC_READ_THROTTLE, Roles, Throttle } from '@kumoko/security';
import type { Response } from 'express';
import { ErrorResponseDto } from '../../../shared/dto/error-response.dto';
import { ParseIdPipe } from '../../../shared/http/parse-id.pipe';
import { CapituloResponseDto, CreateCapituloDto, UpdateCapituloDto } from '../dto/capitulo.dto';
import { CapitulosService } from '../services/capitulos.service';

@ApiTags('capitulos')
@Controller()
export class CapitulosController {
  constructor(private readonly capitulos: CapitulosService) {}

  @Public()
  @Throttle(PUBLIC_READ_THROTTLE)
  @Get('obras/:id/capitulos')
  @ApiOperation({ summary: 'Lista os capitulos de uma obra, ordenados por numero (cache)' })
  @ApiOkResponse({
    type: [CapituloResponseDto],
    headers: { 'X-Cache': { description: 'HIT ou MISS', schema: { type: 'string' } } },
  })
  @ApiResponse({ status: 404, description: 'Obra nao encontrada', type: ErrorResponseDto })
  async list(@Param('id', ParseIdPipe) obraId: number, @Res({ passthrough: true }) res: Response) {
    const result = await this.capitulos.listByObra(obraId);
    setCacheHeader(res, result.hit);
    return result.value;
  }

  @Roles('admin')
  @Post('obras/:id/capitulos')
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Cria capitulo (admin)' })
  @ApiResponse({ status: 201, type: CapituloResponseDto })
  @ApiResponse({ status: 400, description: 'Dados invalidos', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Obra nao encontrada', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Numero de capitulo duplicado', type: ErrorResponseDto })
  create(
    @Param('id', ParseIdPipe) obraId: number,
    @Body() dto: CreateCapituloDto,
  ): Promise<CapituloResponseDto> {
    return this.capitulos.create(obraId, dto);
  }

  @Roles('admin')
  @Patch('capitulos/:id')
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Atualiza numero/titulo do capitulo (admin)' })
  @ApiOkResponse({ type: CapituloResponseDto })
  @ApiResponse({ status: 400, description: 'Dados invalidos', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Capitulo nao encontrado', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Numero de capitulo duplicado', type: ErrorResponseDto })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateCapituloDto): Promise<CapituloResponseDto> {
    return this.capitulos.update(id, dto);
  }

  @Roles('admin')
  @Delete('capitulos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Exclui capitulo (admin) e a pasta de paginas' })
  @ApiResponse({ status: 204, description: 'Excluido' })
  @ApiResponse({ status: 403, description: 'Apenas administradores', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Capitulo nao encontrado', type: ErrorResponseDto })
  async remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.capitulos.remove(id);
  }
}
