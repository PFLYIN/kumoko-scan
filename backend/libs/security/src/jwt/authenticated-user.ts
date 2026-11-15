import type { Request } from 'express';

export const USER_ROLES = ['admin', 'customer'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Usuario autenticado injetado em `request.user` pelo JwtAuthGuard. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  nome: string;
  role: UserRole;
}

/** Payload assinado no JWT. `sub` e o id do usuario serializado como string (RFC 7519). */
export interface JwtPayload {
  sub: string;
  email: string;
  nome: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function toJwtPayload(user: AuthenticatedUser): JwtPayload {
  return {
    sub: String(user.id),
    email: user.email,
    nome: user.nome,
    role: user.role,
  };
}

/** Converte um payload ja verificado em AuthenticatedUser; retorna null se o formato for invalido. */
export function fromJwtPayload(payload: unknown): AuthenticatedUser | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const data = payload as Record<string, unknown>;
  const id = Number(data.sub);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  if (typeof data.email !== 'string' || typeof data.nome !== 'string' || !isUserRole(data.role)) {
    return null;
  }
  return { id, email: data.email, nome: data.nome, role: data.role };
}
