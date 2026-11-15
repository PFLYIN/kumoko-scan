import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import { parseDurationToSeconds } from './duration';

export const AUTH_COOKIE_NAME = 'kumoko_token';

/** Le COOKIE_SECURE (default true). Aceita boolean ja convertido pelo Joi ou string. */
function isCookieSecure(config: ConfigService): boolean {
  const raw = config.get<boolean | string>('COOKIE_SECURE');
  if (raw === undefined || raw === null || raw === '') {
    return true;
  }
  return raw === true || String(raw).toLowerCase() === 'true';
}

function baseCookieOptions(config: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    secure: isCookieSecure(config),
    sameSite: 'strict',
    path: '/',
  };
}

/** Opcoes do cookie de sessao (httpOnly, secure, sameSite strict, maxAge = JWT_EXPIRES_IN). */
export function buildAuthCookieOptions(config: ConfigService): CookieOptions {
  const expiresIn = config.get<string | number>('JWT_EXPIRES_IN') ?? '1h';
  return {
    ...baseCookieOptions(config),
    maxAge: parseDurationToSeconds(expiresIn) * 1000,
  };
}

/** Opcoes para `res.clearCookie` no logout (mesmos atributos, sem maxAge). */
export function buildClearAuthCookieOptions(config: ConfigService): CookieOptions {
  return baseCookieOptions(config);
}
