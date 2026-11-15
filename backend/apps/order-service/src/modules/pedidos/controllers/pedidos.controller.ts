import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@kumoko/common';
import { AUTH_COOKIE_NAME, type AuthenticatedUser, CurrentUser } from '@kumoko/security';
import type { Response } from 'express';
import { CriarPedidoDto } from '../dto/criar-pedido.dto';
import { PaginatedPedidoResponse, PedidoResponse } from '../dto/pedido-response.dto';
import { PedidosService } from '../services/pedidos.service';

@ApiTags('Pedidos')
@ApiBearerAuth()
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria um pedido (preço sempre obtido do catálogo)',
    description: 'O cliente envia apenas obraId e quantidade. Itens da mesma obra são somados.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Chave de 1 a 64 caracteres [A-Za-z0-9-_]. Mesma chave + mesmo usuário devolve o pedido existente (200).',
  })
  @ApiBody({ type: CriarPedidoDto })
  @ApiCreatedResponse({ type: PedidoResponse, description: 'Pedido criado; publica order.completed.' })
  @ApiOkResponse({ type: PedidoResponse, description: 'Pedido já existente para a mesma Idempotency-Key.' })
  @ApiBadRequestResponse({ description: 'Corpo ou Idempotency-Key inválidos.' })
  @ApiUnprocessableEntityResponse({ description: 'Obras inexistentes ou regra do pedido violada.' })
  @ApiServiceUnavailableResponse({ description: 'Catálogo indisponível (circuit breaker aberto ou falhas).' })
  async criar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: CriarPedidoDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PedidoResponse> {
    const { pedido, criado } = await this.pedidos.criar(usuario.id, dto, idempotencyKey);
    res.status(criado ? HttpStatus.CREATED : HttpStatus.OK);
    return pedido;
  }

  @Get()
  @ApiOperation({ summary: 'Lista os pedidos do usuário autenticado (mais recentes primeiro)' })
  @ApiOkResponse({ type: PaginatedPedidoResponse })
  listar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedPedidoResponse> {
    return this.pedidos.listar(usuario.id, { page: query.page, limit: query.limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um pedido (dono ou admin)' })
  @ApiOkResponse({ type: PedidoResponse })
  @ApiBadRequestResponse({ description: 'Id inválido.' })
  @ApiNotFoundResponse({ description: 'Pedido inexistente ou de outro usuário.' })
  obter(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: AuthenticatedUser,
  ): Promise<PedidoResponse> {
    return this.pedidos.obter(id, usuario);
  }
}
