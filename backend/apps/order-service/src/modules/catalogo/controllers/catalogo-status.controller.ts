import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Public, SkipThrottle } from '@kumoko/security';
import { CATALOG_SERVICE_NAME } from '../catalogo.constants';
import { CatalogClient, type EstadoCircuito } from '../catalog.client';

export class CatalogoStatusResponse {
  @ApiProperty({ example: CATALOG_SERVICE_NAME })
  servico: string;

  @ApiProperty({ enum: ['CLOSED', 'OPEN', 'HALF_OPEN'], example: 'CLOSED' })
  circuito: EstadoCircuito;
}

/** Estado do circuit breaker do catalogo (nao afeta o /health: o historico segue disponivel). */
@ApiTags('Catálogo (integração)')
@Public()
@SkipThrottle()
@Controller('catalogo/status')
export class CatalogoStatusController {
  constructor(private readonly catalog: CatalogClient) {}

  @Get()
  @ApiOperation({ summary: 'Estado do circuit breaker da integração com o catálogo' })
  @ApiOkResponse({ type: CatalogoStatusResponse })
  status(): CatalogoStatusResponse {
    return { servico: CATALOG_SERVICE_NAME, circuito: this.catalog.estadoCircuito };
  }
}
