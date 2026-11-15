import { PaginationQueryDto } from '@kumoko/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { emptyToUndefined } from '../../../shared/dto/form-transforms';
import { OrdenacaoObras } from '../domain/ordenacao-obras';
import { TipoObra } from '../domain/tipo-obra';

/** Filtros de GET /api/obras (alem de page/limit). */
export class ListObrasQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TipoObra })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(TipoObra, { message: 'tipo deve ser manga, livro ou novel.' })
  tipo?: TipoObra;

  @ApiPropertyOptional({ description: 'Busca por trecho do nome ou do autor', maxLength: 100 })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString({ message: 'busca deve ser um texto.' })
  @MaxLength(100, { message: 'busca deve ter no máximo 100 caracteres.' })
  busca?: string;

  @ApiPropertyOptional({ description: 'Filtra por gênero (sem diferenciar maiúsculas)', example: 'Fantasia' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString({ message: 'genero deve ser um texto.' })
  @MaxLength(30, { message: 'genero deve ter no máximo 30 caracteres.' })
  genero?: string;

  @ApiPropertyOptional({ enum: OrdenacaoObras, default: OrdenacaoObras.Recentes })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(OrdenacaoObras, {
    message: 'ordenar deve ser recentes, nome, preco-asc, preco-desc ou mais-vendidos.',
  })
  ordenar?: OrdenacaoObras;
}
