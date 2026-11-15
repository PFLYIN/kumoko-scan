import { ApiProperty } from '@nestjs/swagger';

/** Corpo padrao de erro (AllExceptionsFilter), usado apenas para documentacao no Swagger. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Obra não encontrada.',
  })
  message: string | string[];

  @ApiProperty({ example: '/api/obras/999' })
  path: string;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'b7f1c1d2-1f0e-4c55-9d4c-0b1f9f7b6a10', nullable: true, type: String })
  requestId: string | null;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}
