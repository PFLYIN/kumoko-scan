import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { toOptionalNumber } from '../../../shared/dto/form-transforms';

export const RELACIONADAS_LIMIT_PADRAO = 6;
export const RELACIONADAS_LIMIT_MAX = 12;

/** Query de GET /api/obras/:id/relacionadas. */
export class RelacionadasQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: RELACIONADAS_LIMIT_MAX, default: RELACIONADAS_LIMIT_PADRAO })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt({ message: 'limit deve ser um número inteiro.' })
  @Min(1, { message: 'limit deve ser maior ou igual a 1.' })
  @Max(RELACIONADAS_LIMIT_MAX, { message: `limit deve ser no máximo ${RELACIONADAS_LIMIT_MAX}.` })
  limit?: number;
}

/** Item de GET /api/obras/generos. */
export class GeneroContagemDto {
  @ApiPropertyOptional({ example: 'Fantasia' })
  genero: string;

  @ApiPropertyOptional({ example: 12, description: 'Quantidade de obras com o gênero' })
  total: number;
}
