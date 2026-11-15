import type { ConfigService } from '@nestjs/config';
import { buildAuthCookieOptions, buildClearAuthCookieOptions } from './auth-cookie';
import { fromJwtPayload, toJwtPayload } from './authenticated-user';
import { parseDurationToSeconds } from './duration';

const configWith = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('parseDurationToSeconds', () => {
  it.each([
    ['1h', 3600],
    ['15m', 900],
    ['7d', 604800],
    ['30s', 30],
    ['3600', 3600],
  ])('converte %s', (input, expected) => {
    expect(parseDurationToSeconds(input)).toBe(expected);
  });

  it('rejeita formatos invalidos', () => {
    expect(() => parseDurationToSeconds('1 hora')).toThrow();
    expect(() => parseDurationToSeconds('0')).toThrow();
  });
});

describe('cookie de autenticacao', () => {
  it('usa httpOnly, sameSite strict, path / e maxAge de JWT_EXPIRES_IN', () => {
    const options = buildAuthCookieOptions(configWith({ JWT_EXPIRES_IN: '1h', COOKIE_SECURE: true }));
    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 3_600_000,
    });
  });

  it('secure e true por padrao e respeita COOKIE_SECURE=false', () => {
    expect(buildAuthCookieOptions(configWith({})).secure).toBe(true);
    expect(buildClearAuthCookieOptions(configWith({ COOKIE_SECURE: 'false' })).secure).toBe(false);
  });
});

describe('payload JWT', () => {
  it('faz ida e volta entre AuthenticatedUser e JwtPayload', () => {
    const user = { id: 3, email: 'x@k.local', nome: 'X', role: 'admin' as const };
    const payload = toJwtPayload(user);
    expect(payload.sub).toBe('3');
    expect(fromJwtPayload(payload)).toEqual(user);
  });
});
