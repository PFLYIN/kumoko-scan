# @kumoko/cache

Redis (ioredis) e cache-aside.

| Arquivo | Conteudo |
|---|---|
| `redis.module.ts` | `RedisModule.forRoot()` (global): `REDIS_CLIENT` (cache e PUBLISH; `maxRetriesPerRequest: 2`, `enableOfflineQueue: false`, backoff ate 5s) e `REDIS_SUBSCRIBER` (conexao dedicada ao SUBSCRIBE). Fecha as conexoes no shutdown. |
| `cache.service.ts` | `getOrSet<T>(key, ttlSeconds, loader) -> { value, hit }`, `get`, `set`, `invalidate(key)`, `invalidatePrefix(prefix)` (SCAN + UNLINK). Falha do Redis vira warn e a request segue pela origem. |
| `cache-header.ts` | `setCacheHeader(res, hit)` -> `X-Cache: HIT|MISS`. |

Logs: `Cache HIT key=...`, `Cache MISS key=... ttl=...`, `Cache INVALIDATE prefix=... removidas=N`.
