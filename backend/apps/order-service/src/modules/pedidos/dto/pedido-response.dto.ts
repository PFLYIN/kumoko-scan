import { ApiProperty } from '@nestjs/swagger';
import { STATUS_PEDIDO, type StatusPedido, TIPOS_OBRA, type TipoObra } from '../domain/pedido.constants';

export class ItemPedidoResponse {
  @ApiProperty({ example: 3 })
  obraId: number;

  @ApiProperty({ example: 'Dandadan' })
  nome: string;

  @ApiProperty({ enum: TIPOS_OBRA, example: 'manga' })
  tipo: TipoObra;

  @ApiProperty({ type: String, nullable: true, example: '/files/covers/dandadan.jpg' })
  capaUrl: string | null;

  @ApiProperty({ example: 29.9 })
  precoUnitario: number;

  @ApiProperty({ example: 2 })
  quantidade: number;

  @ApiProperty({ example: 59.8 })
  subtotal: number;
}

export class PedidoResponse {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 3 })
  usuarioId: number;

  @ApiProperty({ enum: STATUS_PEDIDO, example: 'CONCLUIDO' })
  status: StatusPedido;

  @ApiProperty({ example: 89.7 })
  total: number;

  @ApiProperty({ type: [ItemPedidoResponse] })
  itens: ItemPedidoResponse[];

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm: string;
}

class PaginationMetaResponse {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 30 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedPedidoResponse {
  @ApiProperty({ type: [PedidoResponse] })
  data: PedidoResponse[];

  @ApiProperty({ type: PaginationMetaResponse })
  meta: PaginationMetaResponse;
}
