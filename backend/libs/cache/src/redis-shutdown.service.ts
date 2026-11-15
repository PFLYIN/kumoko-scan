import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from './redis.constants';

/** Fecha as conexoes Redis no shutdown (enableShutdownHooks). */
@Injectable()
export class RedisShutdownService implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([this.close(this.client), this.close(this.subscriber)]);
  }

  private async close(connection: Redis): Promise<void> {
    try {
      await connection.quit();
    } catch {
      connection.disconnect();
    }
  }
}
