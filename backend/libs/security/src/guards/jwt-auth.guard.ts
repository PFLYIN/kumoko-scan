import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { type AuthenticatedRequest, type AuthenticatedUser, fromJwtPayload } from '../jwt/authenticated-user';
import { extractAccessToken } from '../jwt/token-extractor';

export const AUTH_REQUIRED_MESSAGE = 'Autenticação necessária.';
export const INVALID_TOKEN_MESSAGE = 'Token inválido ou expirado.';

/**
 * Guard global deny-by-default: toda rota exige JWT valido, exceto as marcadas com @Public().
 * Em rotas publicas, se houver token valido, `request.user` tambem e preenchido (auth opcional).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractAccessToken(request);

    if (isPublic) {
      if (token) {
        const user = await this.verify(token);
        if (user) {
          request.user = user;
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException(AUTH_REQUIRED_MESSAGE);
    }
    const user = await this.verify(token);
    if (!user) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }
    request.user = user;
    return true;
  }

  private async verify(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      return fromJwtPayload(payload);
    } catch {
      return null;
    }
  }
}
