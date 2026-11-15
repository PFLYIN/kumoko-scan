import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { MAX_ITENS_DISTINTOS, QUANTIDADE_MAXIMA, QUANTIDADE_MINIMA } from '../domain/pedido.constants';

/** Item enviado pelo cliente: apenas obra e quantidade (o preco vem SEMPRE do catalogo). */
export class ItemPedidoDto {
  @ApiProperty({ example: 3, minimum: 1, description: 'Id da obra no catálogo' })
  @IsInt({ message: 'obraId deve ser um número inteiro.' })
  @Min(1, { message: 'obraId deve ser maior que zero.' })
  obraId: number;

  @ApiProperty({ example: 2, minimum: QUANTIDADE_MINIMA, maximum: QUANTIDADE_MAXIMA })
  @IsInt({ message: 'quantidade deve ser um número inteiro.' })
  @Min(QUANTIDADE_MINIMA, { message: `quantidade deve ser no mínimo ${QUANTIDADE_MINIMA}.` })
  @Max(QUANTIDADE_MAXIMA, { message: `quantidade deve ser no máximo ${QUANTIDADE_MAXIMA}.` })
  quantidade: number;
}

export class CriarPedidoDto {
  @ApiProperty({ type: [ItemPedidoDto], minItems: 1, maxItems: MAX_ITENS_DISTINTOS })
  @IsArray({ message: 'itens deve ser uma lista.' })
  @ArrayMinSize(1, { message: 'O pedido deve ter pelo menos 1 item.' })
  @ArrayMaxSize(MAX_ITENS_DISTINTOS, { message: `O pedido pode ter no máximo ${MAX_ITENS_DISTINTOS} itens.` })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];
}
