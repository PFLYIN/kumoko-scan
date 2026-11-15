import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES, type UserRole } from '@kumoko/security';

/** Representacao publica do usuario (nunca inclui senha nem CPF). */
export class UsuarioResponseDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'Maria Souza' })
  nome: string;

  @ApiProperty({ example: 'maria@exemplo.com' })
  email: string;

  @ApiProperty({ enum: USER_ROLES, example: 'customer' })
  role: UserRole;

  @ApiProperty({
    example: 89.7,
    description: 'Soma dos pedidos concluidos (atualizada pelo evento order.completed).',
  })
  totalGasto: number;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z', format: 'date-time' })
  criadoEm: string;
}
