import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { getRequestId } from '@kumoko/observability';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

/** Corpo padrao de erro de todos os servicos. */
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId: string | null;
}

export const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor. Tente novamente mais tarde.';

interface NormalizedError {
  statusCode: number;
  error: string;
  message: string | string[];
}

function reasonPhrase(status: number): string {
  return STATUS_CODES[status] ?? 'Error';
}

/** Erros de middlewares do Express (ex.: body-parser) carregam `status` e `expose`. */
function readClientErrorStatus(exception: unknown): number | undefined {
  if (!exception || typeof exception !== 'object') {
    return undefined;
  }
  const candidate = exception as { status?: unknown; statusCode?: unknown; expose?: unknown };
  const status = typeof candidate.status === 'number' ? candidate.status : candidate.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500 && candidate.expose === true) {
    return status;
  }
  return undefined;
}

/**
 * Filtro global: padroniza o corpo de erro `{ statusCode, error, message, path, timestamp, requestId }`.
 * Erros inesperados viram 500 com mensagem generica (o detalhe vai apenas para o log).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: unknown }>();
    const response = http.getResponse<Response>();
    const normalized = this.normalize(exception);
    const path = request.originalUrl ?? request.url;

    if (normalized.statusCode >= 500) {
      const intentional =
        exception instanceof HttpException &&
        exception.getStatus() !== (HttpStatus.INTERNAL_SERVER_ERROR as number);
      if (intentional) {
        // 5xx sinalizado de proposito (ex.: 503 com dependencia fora): sem stack trace.
        this.logger.warn(
          `Resposta ${normalized.statusCode} em ${request.method} ${path}: ${exception.message}`,
        );
      } else {
        const detail = exception instanceof Error ? exception.message : String(exception);
        this.logger.error(
          `Erro ${normalized.statusCode} em ${request.method} ${path}: ${detail}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }
    }

    if (response.headersSent) {
      return;
    }
    const requestId = typeof request.id === 'string' ? request.id : (getRequestId() ?? null);
    const body: ErrorResponseBody = {
      ...normalized,
      path,
      timestamp: new Date().toISOString(),
      requestId,
    };
    response.status(normalized.statusCode).json(body);
  }

  normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      if (statusCode === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
        return { statusCode, error: reasonPhrase(statusCode), message: INTERNAL_ERROR_MESSAGE };
      }
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return { statusCode, error: reasonPhrase(statusCode), message: payload };
      }
      const data = payload as { message?: unknown; error?: unknown };
      const message =
        typeof data.message === 'string' || Array.isArray(data.message)
          ? (data.message as string | string[])
          : exception.message;
      const error = typeof data.error === 'string' ? data.error : reasonPhrase(statusCode);
      return { statusCode, error, message };
    }

    const clientStatus = readClientErrorStatus(exception);
    if (clientStatus !== undefined) {
      const message =
        clientStatus === (HttpStatus.PAYLOAD_TOO_LARGE as number)
          ? 'O corpo da requisição excede o tamanho permitido.'
          : 'Requisição inválida.';
      return { statusCode: clientStatus, error: reasonPhrase(clientStatus), message };
    }

    const statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    return { statusCode, error: reasonPhrase(statusCode), message: INTERNAL_ERROR_MESSAGE };
  }
}
