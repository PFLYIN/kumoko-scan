import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { buildPinoParams } from './logging/pino-params';
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { OBSERVABILITY_OPTIONS, type ObservabilityOptions } from './observability.constants';
import { RequestContextMiddleware } from './request-context/request-context.middleware';

/** pino-pretty e devDependency: na imagem de producao ele nao existe, entao so o usamos se instalado. */
function isPinoPrettyInstalled(): boolean {
  try {
    createRequire(join(process.cwd(), 'package.json')).resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

/**
 * Logs JSON (nestjs-pino) com request id, contexto de correlacao (getRequestId)
 * e metricas Prometheus em GET /metrics.
 */
@Module({})
export class ObservabilityModule implements NestModule {
  static forRoot(options: ObservabilityOptions): DynamicModule {
    return {
      module: ObservabilityModule,
      global: true,
      imports: [
        LoggerModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) =>
            buildPinoParams({
              serviceName: options.serviceName,
              level: config.get<string>('LOG_LEVEL') ?? 'info',
              pretty: config.get<string>('NODE_ENV') === 'development' && isPinoPrettyInstalled(),
            }),
        }),
      ],
      controllers: [MetricsController],
      providers: [{ provide: OBSERVABILITY_OPTIONS, useValue: options }, MetricsService],
      exports: [LoggerModule, MetricsService, OBSERVABILITY_OPTIONS],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, HttpMetricsMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
