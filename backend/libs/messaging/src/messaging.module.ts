import { type DynamicModule, Module } from '@nestjs/common';
import { EventBus } from './event-bus';
import { MESSAGING_OPTIONS, type MessagingOptions } from './messaging.constants';

/** Disponibiliza o EventBus globalmente. Requer RedisModule.forRoot() importado no app. */
@Module({})
export class MessagingModule {
  static forRoot(options: MessagingOptions): DynamicModule {
    return {
      module: MessagingModule,
      global: true,
      providers: [{ provide: MESSAGING_OPTIONS, useValue: options }, EventBus],
      exports: [EventBus],
    };
  }
}
