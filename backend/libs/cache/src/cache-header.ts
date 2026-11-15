import type { Response } from 'express';

export const CACHE_HEADER = 'X-Cache';

/**
 * Seta `X-Cache: HIT|MISS` na resposta. Uso no controller:
 * `@Res({ passthrough: true }) res: Response` e depois `setCacheHeader(res, result.hit)`.
 */
export function setCacheHeader(res: Pick<Response, 'setHeader'>, hit: boolean): void {
  res.setHeader(CACHE_HEADER, hit ? 'HIT' : 'MISS');
}
