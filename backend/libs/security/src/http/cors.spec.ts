import { buildCorsOptions, parseCorsOrigins } from './cors';

type OriginFn = (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void;

const check = (originFn: OriginFn, origin: string | undefined) =>
  new Promise<boolean | undefined>((resolve) => originFn(origin, (_err, allow) => resolve(allow)));

describe('CORS', () => {
  it('parseia a lista CSV ignorando espacos, vazios e barra final', () => {
    expect(parseCorsOrigins(' https://localhost:8443/ , ,http://localhost:5173')).toEqual([
      'https://localhost:8443',
      'http://localhost:5173',
    ]);
    expect(parseCorsOrigins(undefined)).toEqual([]);
  });

  it('libera apenas origens da lista, com credentials', async () => {
    const options = buildCorsOptions('https://localhost:8443,http://localhost:5173');
    const origin = options.origin as OriginFn;

    expect(options.credentials).toBe(true);
    await expect(check(origin, 'http://localhost:5173')).resolves.toBe(true);
    await expect(check(origin, 'https://evil.example')).resolves.toBe(false);
    // Sem Origin (curl, chamada servico-a-servico) e permitido.
    await expect(check(origin, undefined)).resolves.toBe(true);
  });
});
