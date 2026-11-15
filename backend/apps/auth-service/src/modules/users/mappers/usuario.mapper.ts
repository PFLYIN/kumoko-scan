import type { AuthenticatedUser } from '@kumoko/security';
import type { UsuarioResponseDto } from '../dto/usuario-response.dto';
import type { User } from '../entities/user.entity';

/** Entity -> resposta publica (sem senha/CPF). */
export function toUsuarioResponse(user: User): UsuarioResponseDto {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    totalGasto: Number(user.totalGasto ?? 0),
    criadoEm: new Date(user.criadoEm).toISOString(),
  };
}

/** Entity -> dados assinados no JWT. */
export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return { id: user.id, email: user.email, nome: user.nome, role: user.role };
}
