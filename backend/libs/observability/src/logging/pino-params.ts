import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { isInfraPath } from '../observability.constants';
import { resolveRequestId } from '../request-context/request-id';

export interface PinoParamsOptions {
  serviceName: string;
  level?: string;
  /** Saida legivel (pino-pretty). Use apenas em desenvolvimento local. */
  pretty?: boolean;
}

/** Campos sensiveis que nunca devem aparecer nos logs. */
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.senha',
  '*.senhaAtual',
  '*.novaSenha',
  '*.senhaHash',
  '*.password',
  '*.accessToken',
  '*.token',
];

/** O roteador do Express reescreve `req.url`; para log usamos a URL original. */
function originalUrl(req: IncomingMessage): string | undefined {
  return (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url;
}

/** Configuracao do nestjs-pino: JSON estruturado, request id, redacao e nivel por status. */
export function buildPinoParams(options: PinoParamsOptions): Params {
  return {
    pinoHttp: {
      level: options.level ?? 'info',
      base: { service: options.serviceName },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      genReqId: (req: IncomingMessage, res: ServerResponse) => resolveRequestId(req, res),
      quietReqLogger: true,
      redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
      autoLogging: {
        ignore: (req: IncomingMessage) => isInfraPath(req.url),
      },
      customLogLevel: (_req, res, error) => {
        if (error || res.statusCode >= 500) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },
      customSuccessMessage: (req, res, responseTime) =>
        `${req.method} ${originalUrl(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
      customErrorMessage: (req, res, error) =>
        `${req.method} ${originalUrl(req)} ${res.statusCode} falhou: ${error.message}`,
      serializers: {
        req: (req: { id?: unknown; method?: string; url?: string; remoteAddress?: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        }),
        res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
      },
      transport: options.pretty
        ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
        : undefined,
    },
  };
}
