import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from './request-context';
import { resolveRequestId } from './request-id';

/** Abre o contexto de correlacao (AsyncLocalStorage) para toda a request. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req, res);
    runWithRequestContext({ requestId }, () => next());
  }
}
