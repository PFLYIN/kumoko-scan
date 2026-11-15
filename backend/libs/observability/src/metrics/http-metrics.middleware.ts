import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { isInfraPath } from '../observability.constants';
import { MetricsService } from './metrics.service';

/** Le o padrao da rota casada pelo Express (ex.: /api/obras/:id), se houver. */
function matchedRoutePath(req: Request): string | undefined {
  const route = (req as { route?: unknown }).route;
  if (route && typeof route === 'object' && typeof (route as { path?: unknown }).path === 'string') {
    return (route as { path: string }).path;
  }
  return undefined;
}

/**
 * Mede a duracao de cada request. O label `route` usa o padrao da rota (ex.: /api/obras/:id),
 * nunca a URL concreta, para nao explodir a cardinalidade.
 */
@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (isInfraPath(req.originalUrl)) {
      next();
      return;
    }
    const end = this.metrics.startHttpTimer();
    res.once('finish', () => {
      const routePath = matchedRoutePath(req);
      const route = routePath ? `${req.baseUrl ?? ''}${routePath}` : 'unmatched';
      end({ method: req.method, route, status_code: String(res.statusCode) });
    });
    next();
  }
}
