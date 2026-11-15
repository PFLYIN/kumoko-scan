import {
  type ArgumentsHost,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { runWithRequestContext } from '@kumoko/observability';
import { AllExceptionsFilter, type ErrorResponseBody, INTERNAL_ERROR_MESSAGE } from './all-exceptions.filter';

interface ResponseMock {
  statusCode?: number;
  body?: ErrorResponseBody;
  headersSent: boolean;
  status: jest.Mock;
  json: jest.Mock;
}

function createHost(request: Record<string, unknown> = {}) {
  const response: ResponseMock = {
    headersSent: false,
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockImplementation((code: number) => {
    response.statusCode = code;
    return response;
  });
  response.json.mockImplementation((body: ErrorResponseBody) => {
    response.body = body;
    return response;
  });
  const req = { method: 'GET', url: '/obras/1', originalUrl: '/api/obras/1', ...request };
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('formata HttpException com { statusCode, error, message, path, timestamp, requestId }', () => {
    const { host, response } = createHost({ id: 'req-1' });

    filter.catch(new NotFoundException('Obra não encontrada.'), host);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Obra não encontrada.',
      path: '/api/obras/1',
      timestamp: expect.any(String) as string,
      requestId: 'req-1',
    });
    expect(Object.keys(response.body ?? {})).toEqual([
      'statusCode',
      'error',
      'message',
      'path',
      'timestamp',
      'requestId',
    ]);
  });

  it('mantem a lista de mensagens de validacao (string[])', () => {
    const { host, response } = createHost();
    filter.catch(new BadRequestException(['nome deve ser texto', 'preco deve ser positivo']), host);
    expect(response.statusCode).toBe(400);
    expect(response.body?.error).toBe('Bad Request');
    expect(response.body?.message).toEqual(['nome deve ser texto', 'preco deve ser positivo']);
  });

  it('usa o request id do contexto de correlacao quando req.id nao existe', () => {
    const { host, response } = createHost();
    runWithRequestContext({ requestId: 'ctx-42' }, () =>
      filter.catch(new ConflictException('Duplicado.'), host),
    );
    expect(response.body?.requestId).toBe('ctx-42');
  });

  it('requestId e null fora de uma request', () => {
    const { host, response } = createHost();
    filter.catch(new ConflictException('Duplicado.'), host);
    expect(response.body?.requestId).toBeNull();
  });

  it('erro inesperado vira 500 generico sem vazar detalhe interno', () => {
    const { host, response } = createHost();
    filter.catch(new Error("ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'10.0.0.5'"), host);

    expect(response.statusCode).toBe(500);
    expect(response.body?.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(JSON.stringify(response.body)).not.toContain('root');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('InternalServerErrorException tambem nao expoe a mensagem original', () => {
    const { host, response } = createHost();
    filter.catch(new InternalServerErrorException('stack trace secreto'), host);
    expect(response.body?.message).toBe(INTERNAL_ERROR_MESSAGE);
  });

  it('503 intencional preserva a mensagem amigavel', () => {
    const { host, response } = createHost();
    const message = 'Catálogo indisponível no momento. Tente novamente em instantes.';
    filter.catch(new ServiceUnavailableException(message), host);
    expect(response.statusCode).toBe(503);
    expect(response.body?.message).toBe(message);
  });

  it('503 intencional loga warn sem stack e nao loga error', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { host } = createHost();
    filter.catch(new ServiceUnavailableException('Catálogo indisponível.'), host);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]).toHaveLength(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('InternalServerErrorException loga error com stack', () => {
    const { host } = createHost();
    filter.catch(new InternalServerErrorException('falha'), host);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('InternalServerErrorException'),
    );
  });

  it('erros 4xx de middlewares (ex.: corpo grande demais) mantem o status', () => {
    const { host, response } = createHost();
    const tooLarge = Object.assign(new Error('request entity too large'), { status: 413, expose: true });
    filter.catch(tooLarge, host);
    expect(response.statusCode).toBe(413);
    expect(response.body?.error).toBe('Payload Too Large');
  });

  it('nao escreve se a resposta ja foi enviada', () => {
    const { host, response } = createHost();
    response.headersSent = true;
    filter.catch(new NotFoundException(), host);
    expect(response.status).not.toHaveBeenCalled();
  });
});
