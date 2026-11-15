import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME, Roles } from '@kumoko/security';
import { ListarPedidosAdminQueryDto, ResumoQueryDto, ResumoVendasResponse } from '../dto/admin-pedidos.dto';
import { PaginatedPedidoResponse } from '../dto/pedido-response.dto';
import { PedidosAdminService } from '../services/pedidos-admin.service';

/** Visao administrativa de vendas. Registrado ANTES do PedidosController (rota estatica antes de :id). */
@ApiTags('Pedidos (admin)')
@ApiBearerAuth()
@ApiCookieAuth(AUTH_COOKIE_NAME)
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
@ApiForbiddenResponse({ description: 'Apenas administradores.' })
@Roles('admin')
@Controller('pedidos/admin')
export class PedidosAdminController {
  constructor(private readonly admin: PedidosAdminService) {}

  @Get('resumo')
  @ApiOperation({
    summary: 'KPIs de vendas, vendas por dia, top obras e pedidos recentes',
    description: 'Considera apenas pedidos CONCLUIDO. Cache em memória de 15s.',
  })
  @ApiOkResponse({ type: ResumoVendasResponse })
  @ApiBadRequestResponse({ description: 'dias fora de 1..365.' })
  resumo(@Query() query: ResumoQueryDto): Promise<ResumoVendasResponse> {
    return this.admin.resumo(query.dias);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pedidos (filtros por status e cliente)' })
  @ApiOkResponse({ type: PaginatedPedidoResponse })
  @ApiBadRequestResponse({ description: 'Filtros inválidos.' })
  listar(@Query() query: ListarPedidosAdminQueryDto): Promise<PaginatedPedidoResponse> {
    return this.admin.listar(
      { status: query.status, usuarioId: query.usuarioId },
      { page: query.page, limit: query.limit },
    );
  }
}
