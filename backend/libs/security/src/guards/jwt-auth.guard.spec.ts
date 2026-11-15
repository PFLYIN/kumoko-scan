import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../decorators/public.decorator';
import { AUTH_COOKIE_NAME } from '../jwt/auth-cookie';
import { type AuthenticatedUser, toJwtPayload } from '../jwt/authenticated-user';
import { createHttpContext } from '../testing/execution-context.mock';
import { JwtAuthGuard } from './jwt-auth.guard';

const SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';

class TestController {
  @Public()
  publicRoute(): void {}

  privateRoute(): void {}
}

@Public()
class PublicController {
  anyRoute(): void {}
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({ secret: SECRET, signOptions: { expiresIn: 3600 } });
  const guard = new JwtAuthGuard(new Reflector(), jwtService);
  const user: AuthenticatedUser = { id: 7, email: 'ana@kumoko.local', nome: 'Ana', role: 'customer' };

  const sign = (payload: object = toJwtPayload(user)) => jwtService.sign(payload);

  const privateContext = (request: Record<string, unknown>) =>
    createHttpContext(request, TestController.prototype.privateRoute, TestController);

  it('libera rota @Public() sem token', async () => {
    const request = { headers: {} };
    const context = createHttpContext(request, TestController.prototype.publicRoute, TestController);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).not.toHaveProperty('user');
  });

  it('libera controller inteiro marcado com @Public()', async () => {
    const context = createHttpContext({ headers: {} }, PublicController.prototype.anyRoute, PublicController);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('preenche request.user em rota publica quando ha token valido', async () => {
    const request: Record<string, unknown> = { headers: { authorization: `Bearer ${sign()}` } };
    const context = createHttpContext(request, TestController.prototype.publicRoute, TestController);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('aceita token no header Authorization: Bearer', async () => {
    const request: Record<string, unknown> = { headers: { authorization: `Bearer ${sign()}` } };
    await expect(guard.canActivate(privateContext(request))).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('aceita token no cookie kumoko_token', async () => {
    const request: Record<string, unknown> = {
      headers: {},
      cookies: { [AUTH_COOKIE_NAME]: sign() },
    };
    await expect(guard.canActivate(privateContext(request))).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('prioriza o header quando header e cookie estao presentes', async () => {
    const admin: AuthenticatedUser = { id: 1, email: 'admin@kumoko.local', nome: 'Admin', role: 'admin' };
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${sign(toJwtPayload(admin))}` },
      cookies: { [AUTH_COOKIE_NAME]: sign() },
    };
    await guard.canActivate(privateContext(request));
    expect(request.user).toEqual(admin);
  });

  it('rejeita com 401 quando nao ha token', async () => {
    await expect(guard.canActivate(privateContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejeita token com assinatura invalida', async () => {
    const forged = new JwtService({ secret: 'outro-segredo-qualquer-com-32-caracteres!!' }).sign(
      toJwtPayload(user),
    );
    const request = { headers: { authorization: `Bearer ${forged}` } };
    await expect(guard.canActivate(privateContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token expirado', async () => {
    // Assinado com o mesmo segredo, mas com `exp` no passado.
    const expired = new JwtService({ secret: SECRET }).sign({
      ...toJwtPayload(user),
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const request = { headers: { authorization: `Bearer ${expired}` } };
    await expect(guard.canActivate(privateContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita payload sem os campos esperados', async () => {
    const request = { headers: { authorization: `Bearer ${sign({ sub: 'abc', role: 'root' })}` } };
    await expect(guard.canActivate(privateContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
