import { ApiProperty } from '@nestjs/swagger';

/** Corpo padrao de erro (AllExceptionsFilter), usado apenas na documentacao Swagger. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['CPF inválido.'],
  })
  message: string | string[];

  @ApiProperty({ example: '/api/auth/register' })
  path: string;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ type: String, nullable: true, example: '9b1c2f4e-0d7a-4a57-9c3e-2f1d8a6b5c4d' })
  requestId: string | null;
}
