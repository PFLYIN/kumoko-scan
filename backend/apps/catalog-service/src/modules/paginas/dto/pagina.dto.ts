import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';
import { toOptionalNumber } from '../../../shared/dto/form-transforms';

export const PAGINA_NUMERO_MAX = 9999;

/** Campos multipart de POST /api/capitulos/:id/paginas (alem do arquivo `imagem`). */
export class CreatePaginaDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGINA_NUMERO_MAX,
    description: 'Padrao: proximo numero livre',
  })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt({ message: 'numero deve ser um número inteiro.' })
  @Min(1, { message: 'numero deve ser maior ou igual a 1.' })
  @Max(PAGINA_NUMERO_MAX, { message: `numero deve ser no máximo ${PAGINA_NUMERO_MAX}.` })
  numero?: number;
}

/** Corpo de PUT /api/capitulos/:id/paginas/ordem: todos os ids das paginas na nova ordem. */
export class ReordenarPaginasDto {
  @ApiProperty({
    type: [Number],
    example: [12, 10, 11],
    description: 'Ids de TODAS as paginas do capitulo, na nova ordem (numero passa a ser 1..N).',
  })
  @IsArray({ message: 'paginaIds deve ser uma lista de ids.' })
  @ArrayNotEmpty({ message: 'paginaIds não pode ser vazio.' })
  @ArrayMaxSize(PAGINA_NUMERO_MAX, { message: `paginaIds aceita no máximo ${PAGINA_NUMERO_MAX} ids.` })
  @IsInt({ each: true, message: 'Cada id de paginaIds deve ser um número inteiro.' })
  @Min(1, { each: true, message: 'Cada id de paginaIds deve ser positivo.' })
  paginaIds: number[];
}

export class PaginaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  capituloId: number;

  @ApiProperty({ example: 1 })
  numero: number;

  @ApiProperty({ example: '/files/pages/obra_1/capitulo_1/1731600000000-uuid.jpg' })
  imagemUrl: string;

  @ApiProperty({
    example: '/files/pages/obra_1/capitulo_1/1731600000000-uuid.reader.webp',
    description: 'Versao WebP de leitura (max 1200px); igual a imagemUrl se ainda nao gerada.',
  })
  imagemOtimizadaUrl: string;
}
