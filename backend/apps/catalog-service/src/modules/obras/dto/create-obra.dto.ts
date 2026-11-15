import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  toNullableNumber,
  toNumber,
  toGenerosList,
  toOptionalNumber,
  trimString,
  trimToNull,
} from '../../../shared/dto/form-transforms';
import {
  AUTOR_MAX,
  AVALIACAO_MAXIMA,
  AVALIACAO_MINIMA,
  DESCRICAO_MAX,
  NOME_MAX,
  PRECO_MAXIMO,
  PRECO_MINIMO,
  VOLUME_MAXIMO,
} from '../domain/obra-rules';
import { GENERO_MAX, GENEROS_MAX } from '../domain/generos';
import { TipoObra } from '../domain/tipo-obra';

/**
 * Corpo multipart de POST /api/obras. Os campos chegam como string: os @Transform convertem
 * numeros e transformam '' em null nos campos anulaveis (autor, descricao, volume).
 */
export class CreateObraDto {
  @ApiProperty({ enum: TipoObra })
  @IsEnum(TipoObra, { message: 'tipo deve ser manga, livro ou novel.' })
  tipo: TipoObra;

  @ApiProperty({ minLength: 1, maxLength: NOME_MAX, example: 'Dandadan' })
  @Transform(trimString)
  @IsString({ message: 'nome deve ser um texto.' })
  @Length(1, NOME_MAX, { message: `nome deve ter entre 1 e ${NOME_MAX} caracteres.` })
  nome: string;

  @ApiPropertyOptional({ maxLength: AUTOR_MAX, nullable: true, type: String })
  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: 'autor deve ser um texto.' })
  @MaxLength(AUTOR_MAX, { message: `autor deve ter no máximo ${AUTOR_MAX} caracteres.` })
  autor?: string | null;

  @ApiPropertyOptional({ maxLength: DESCRICAO_MAX, nullable: true, type: String })
  @Transform(trimToNull)
  @IsOptional()
  @IsString({ message: 'descricao deve ser um texto.' })
  @MaxLength(DESCRICAO_MAX, { message: `descricao deve ter no máximo ${DESCRICAO_MAX} caracteres.` })
  descricao?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Ação, Fantasia, Isekai',
    description: `Gêneros separados por vírgula (máx. ${GENEROS_MAX}, cada um até ${GENERO_MAX} caracteres). '' limpa a lista.`,
  })
  @Transform(toGenerosList)
  @IsOptional()
  @IsArray({ message: 'generos deve ser uma lista separada por vírgula.' })
  generos?: string[];

  @ApiPropertyOptional({
    minimum: 1,
    maximum: VOLUME_MAXIMO,
    nullable: true,
    type: Number,
    description: 'Ignorado para livros',
  })
  @Transform(toNullableNumber)
  @IsOptional()
  @IsInt({ message: 'volume deve ser um número inteiro.' })
  @Min(1, { message: 'volume deve ser maior ou igual a 1.' })
  @Max(VOLUME_MAXIMO, { message: `volume deve ser no máximo ${VOLUME_MAXIMO}.` })
  volume?: number | null;

  @ApiProperty({ minimum: PRECO_MINIMO, maximum: PRECO_MAXIMO, example: 39.9 })
  @Transform(toNumber)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false },
    { message: 'preco deve ser um número com até 2 casas decimais.' },
  )
  @Min(PRECO_MINIMO, { message: `preco deve ser maior ou igual a ${PRECO_MINIMO}.` })
  @Max(PRECO_MAXIMO, { message: `preco deve ser no máximo ${PRECO_MAXIMO}.` })
  preco: number;

  @ApiPropertyOptional({ minimum: AVALIACAO_MINIMA, maximum: AVALIACAO_MAXIMA, default: 5, example: 4.5 })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1, allowNaN: false },
    { message: 'avaliacao deve ser um número com até 1 casa decimal.' },
  )
  @Min(AVALIACAO_MINIMA, { message: `avaliacao deve ser maior ou igual a ${AVALIACAO_MINIMA}.` })
  @Max(AVALIACAO_MAXIMA, { message: `avaliacao deve ser no máximo ${AVALIACAO_MAXIMA}.` })
  avaliacao?: number;
}

/** Campo de arquivo opcional documentado no Swagger (multipart). */
export const CAPA_FILE_SCHEMA = {
  type: 'string',
  format: 'binary',
  description: 'Capa (JPG, PNG ou WEBP, até 5 MB)',
} as const;
