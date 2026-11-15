import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestId, runWithRequestContext } from './request-context';
import { resolveRequestId } from './request-id';

describe('getRequestId', () => {
  it('retorna undefined fora de uma request', () => {
    expect(getRequestId()).toBeUndefined();
  });

  it('retorna o id dentro do contexto, inclusive apos operacoes assincronas', async () => {
    const result = await runWithRequestContext({ requestId: 'abc' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return getRequestId();
    });
    expect(result).toBe('abc');
    expect(getRequestId()).toBeUndefined();
  });
});

describe('resolveRequestId', () => {
  const createRes = () => {
    const headers: Record<string, string> = {};
    const res = {
      headersSent: false,
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
    } as unknown as ServerResponse;
    return { res, headers };
  };

  it('reaproveita o X-Request-Id recebido do gateway e devolve no header', () => {
    const req = { headers: { 'x-request-id': 'nginx-req-1' } } as unknown as IncomingMessage;
    const { res, headers } = createRes();
    expect(resolveRequestId(req, res)).toBe('nginx-req-1');
    expect(headers['X-Request-Id']).toBe('nginx-req-1');
  });

  it('gera UUID quando o header esta ausente ou e inseguro', () => {
    const missing = { headers: {} } as unknown as IncomingMessage;
    const unsafe = { headers: { 'x-request-id': 'a b\nc' } } as unknown as IncomingMessage;
    expect(resolveRequestId(missing)).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveRequestId(unsafe)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('e idempotente: a segunda chamada devolve o mesmo id', () => {
    const req = { headers: {} } as unknown as IncomingMessage;
    expect(resolveRequestId(req)).toBe(resolveRequestId(req));
  });
});
