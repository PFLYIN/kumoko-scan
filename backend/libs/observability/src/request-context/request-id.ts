import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

type RequestWithId = IncomingMessage & { id?: unknown };

/**
 * Resolve o id da request de forma idempotente: reaproveita `req.id` se ja definido,
 * senao usa o header X-Request-Id (se seguro) ou gera um UUID. Devolve o id no header da resposta.
 * Usado tanto pelo pino-http (genReqId) quanto pelo middleware de contexto.
 */
export function resolveRequestId(req: IncomingMessage, res?: ServerResponse): string {
  const request = req as RequestWithId;
  if (typeof request.id === 'string' && request.id.length > 0) {
    return request.id;
  }
  const header = req.headers[REQUEST_ID_HEADER];
  const candidate = Array.isArray(header) ? header[0] : header;
  const requestId = candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID();
  request.id = requestId;
  if (res && !res.headersSent) {
    res.setHeader('X-Request-Id', requestId);
  }
  return requestId;
}
