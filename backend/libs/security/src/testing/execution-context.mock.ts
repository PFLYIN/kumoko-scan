import type { ExecutionContext } from '@nestjs/common';

/** ExecutionContext HTTP minimo para testar guards sem subir a aplicacao. */
export function createHttpContext(
  request: Record<string, unknown>,
  handler: (...args: unknown[]) => unknown,
  controller: abstract new (...args: never[]) => unknown,
): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => controller,
    getArgs: () => [request],
    getArgByIndex: () => request,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
    switchToRpc: () => {
      throw new Error('nao suportado');
    },
    switchToWs: () => {
      throw new Error('nao suportado');
    },
  } as unknown as ExecutionContext;
}
