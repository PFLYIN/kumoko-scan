import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@kumoko/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { STATUS_PEDIDO, type StatusPedido, TIPOS_OBRA, type TipoObra } from '../domain/pedido.constants';
import { PedidoResponse } from './pedido-response.dto';

export const RESUMO_DIAS_PADRAO = 30;
export const RESUMO_DIAS_MAX = 365;

/** Filtros da listagem administrativa de pedidos. */
export class ListarPedidosAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: STATUS_PEDIDO })
  @IsOptional()
  @IsIn(STATUS_PEDIDO, { message: `status deve ser um de: ${STATUS_PEDIDO.join(', ')}.` })
  status?: StatusPedido;

  @ApiPropertyOptional({ minimum: 1, description: 'Filtra pelos pedidos de um cliente.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'usuarioId deve ser um número inteiro.' })
  @Min(1, { message: 'usuarioId deve ser maior que zero.' })
  usuarioId?: number;
}

export class ResumoQueryDto {
  @ApiPropertyOptional({ default: RESUMO_DIAS_PADRAO, minimum: 1, maximum: RESUMO_DIAS_MAX })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'dias deve ser um número inteiro.' })
  @Min(1, { message: 'dias deve ser no mínimo 1.' })
  @Max(RESUMO_DIAS_MAX, { message: `dias deve ser no máximo ${RESUMO_DIAS_MAX}.` })
  dias: number = RESUMO_DIAS_PADRAO;
}

export class VendaDiaResponse {
  @ApiProperty({ example: '2026-11-14', description: 'Dia (UTC) no formato YYYY-MM-DD' })
  data: string;

  @ApiProperty({ example: 159.4 })
  receita: number;

  @ApiProperty({ example: 4 })
  pedidos: number;
}

export class TopObraResponse {
  @ApiProperty({ example: 3 })
  obraId: number;

  @ApiProperty({ example: 'Dandadan' })
  nome: string;

  @ApiProperty({ enum: TIPOS_OBRA })
  tipo: TipoObra;

  @ApiProperty({ type: String, nullable: true })
  capaUrl: string | null;

  @ApiProperty({ example: 12, description: 'Unidades vendidas no período' })
  quantidade: number;

  @ApiProperty({ example: 358.8 })
  receita: number;
}

export class ResumoVendasResponse {
  @ApiProperty({ example: 30 })
  dias: number;

  @ApiProperty({ example: 1290.5, description: 'Receita de todos os pedidos concluídos (desde sempre)' })
  receitaTotal: number;

  @ApiProperty({ example: 42 })
  totalPedidos: number;

  @ApiProperty({ example: 30.73 })
  ticketMedio: number;

  @ApiProperty({ example: 11, description: 'Clientes distintos com ao menos um pedido' })
  clientesCompradores: number;

  @ApiProperty({ example: 96, description: 'Unidades vendidas (desde sempre)' })
  itensVendidos: number;

  @ApiProperty({ example: 480.2 })
  receitaPeriodo: number;

  @ApiProperty({ example: 15 })
  pedidosPeriodo: number;

  @ApiProperty({ type: [VendaDiaResponse], description: 'Um ponto por dia do período, inclusive dias sem venda' })
  vendasPorDia: VendaDiaResponse[];

  @ApiProperty({ type: [TopObraResponse], description: 'Até 5 obras mais vendidas no período' })
  topObras: TopObraResponse[];

  @ApiProperty({ type: [PedidoResponse], description: 'Os 5 pedidos mais recentes' })
  pedidosRecentes: PedidoResponse[];
}
