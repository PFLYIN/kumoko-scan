import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest, UserRole } from '../jwt/authenticated-user';
import { AUTH_REQUIRED_MESSAGE } from './jwt-auth.guard';

export const FORBIDDEN_MESSAGE = 'Acesso negado: permissão insuficiente.';

/** Verifica os papeis exigidos por @Roles(). Roda depois do JwtAuthGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new UnauthorizedException(AUTH_REQUIRED_MESSAGE);
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }
    return true;
  }
}
