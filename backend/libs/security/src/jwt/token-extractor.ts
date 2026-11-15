import type { Request } from 'express';
import { AUTH_COOKIE_NAME } from './auth-cookie';

/** Extrai o token do header `Authorization: Bearer` ou, na falta dele, do cookie `kumoko_token`. */
export function extractAccessToken(request: Request): string | undefined {
  const header = request.headers?.authorization;
  if (typeof header === 'string') {
    const [scheme, token] = header.trim().split(/\s+/);
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }
  }
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const cookieToken = cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return undefined;
}
