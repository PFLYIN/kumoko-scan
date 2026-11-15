import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../jwt/authenticated-user';

/**
 * Injeta o usuario autenticado (`request.user`). Aceita uma propriedade opcional:
 * `@CurrentUser() user` ou `@CurrentUser('id') userId`.
 */
export const CurrentUser = createParamDecorator(
  (property: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return property ? user?.[property] : user;
  },
);
