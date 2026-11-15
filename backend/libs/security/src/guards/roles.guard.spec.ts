import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../jwt/authenticated-user';
import { createHttpContext } from '../testing/execution-context.mock';
import { RolesGuard } from './roles.guard';

class TestController {
  @Roles('admin')
  adminRoute(): void {}

  openRoute(): void {}
}

@Roles('admin', 'customer')
class AnyRoleController {
  route(): void {}
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const admin: AuthenticatedUser = { id: 1, email: 'a@k.local', nome: 'Admin', role: 'admin' };
  const customer: AuthenticatedUser = { id: 2, email: 'c@k.local', nome: 'Cliente', role: 'customer' };

  it('libera rota sem @Roles()', () => {
    const context = createHttpContext({}, TestController.prototype.openRoute, TestController);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('libera admin em rota @Roles("admin")', () => {
    const context = createHttpContext({ user: admin }, TestController.prototype.adminRoute, TestController);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('nega customer em rota @Roles("admin") com 403', () => {
    const context = createHttpContext(
      { user: customer },
      TestController.prototype.adminRoute,
      TestController,
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('retorna 401 se a rota exige papel e nao ha usuario', () => {
    const context = createHttpContext({}, TestController.prototype.adminRoute, TestController);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('considera @Roles() declarado no controller', () => {
    const context = createHttpContext(
      { user: customer },
      AnyRoleController.prototype.route,
      AnyRoleController,
    );
    expect(guard.canActivate(context)).toBe(true);
  });
});
