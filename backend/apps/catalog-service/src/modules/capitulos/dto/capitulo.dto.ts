import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { trimToNull } from '../../../shared/dto/form-transforms';

export const CAPITULO_NUMERO_MAX = 9999.99;
export const CAPITULO_TITULO_MAX = 255;

/** Corpo de POST /api/obras/:id/capitulos. */
export class CreateCapituloDto {
  @ApiProperty({
    example: 10.5,
    minimum: 0.01,
    maximum: CAPITULO_NUMERO_MAX,
    description: 'Até 2 casas decimais',
  })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false },
    { message: 'numero deve ser um número com até 2 casas decimais.' },
  )
  @Min(0.01, { message: 'numero deve ser maior que zero.' })
  @Max(CAPITULO_NUMERO_MAX, { message: `numero deve ser no máximo ${CAPITULO_NUMERO_MAX}.` })
  numero: number;

  @ApiPropertyOptional({ example: 'O começo', nullable: true, type: String, maxLength: CAPITULO_TITULO_MAX })
  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: 'titulo deve ser um texto.' })
  @MaxLength(CAPITULO_TITULO_MAX, { message: `titulo deve ter no máximo ${CAPITULO_TITULO_MAX} caracteres.` })
  titulo?: string | null;
}

/** Corpo de PATCH /api/capitulos/:id (titulo null limpa o titulo). */
export class UpdateCapituloDto {
  @ApiPropertyOptional({ example: 11, minimum: 0.01, maximum: CAPITULO_NUMERO_MAX })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false },
    { message: 'numero deve ser um número com até 2 casas decimais.' },
  )
  @Min(0.01, { message: 'numero deve ser maior que zero.' })
  @Max(CAPITULO_NUMERO_MAX, { message: `numero deve ser no máximo ${CAPITULO_NUMERO_MAX}.` })
  numero?: number;

  @ApiPropertyOptional({ nullable: true, type: String, maxLength: CAPITULO_TITULO_MAX })
  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: 'titulo deve ser um texto.' })
  @MaxLength(CAPITULO_TITULO_MAX, { message: `titulo deve ter no máximo ${CAPITULO_TITULO_MAX} caracteres.` })
  titulo?: string | null;
}

export class CapituloResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  obraId: number;

  @ApiProperty({ example: 10.5 })
  numero: number;

  @ApiProperty({ example: 'O começo', nullable: true, type: String })
  titulo: string | null;

  @ApiProperty({ example: 12 })
  totalPaginas: number;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z' })
  criadoEm: string;
}
