import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

/** Executa `fn` dentro de um contexto de correlacao (request HTTP ou evento recebido). */
export function runWithRequestContext<T>(context: RequestContextStore, fn: () => T): T {
  return storage.run(context, fn);
}

/** Id de correlacao do fluxo atual; `undefined` fora de uma request/evento. */
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
