import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
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

export class PaginaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  capituloId: number;

  @ApiProperty({ example: 1 })
  numero: number;

  @ApiProperty({ example: '/files/pages/obra_1/capitulo_1/1731600000000-uuid.jpg' })
  imagemUrl: string;
}
