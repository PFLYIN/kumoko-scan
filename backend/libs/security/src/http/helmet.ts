import helmet from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Helmet com defaults seguros. A CSP e relaxada so o necessario para o Swagger UI
 * (estilos inline e imagens data:). O gateway Nginx aplica a CSP do SPA.
 */
export function createHelmetMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }) as RequestHandler;
}
