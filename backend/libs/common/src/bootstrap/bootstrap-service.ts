import { ConsoleLogger, Logger as NestLogger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type IEntryNestModule, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AUTH_COOKIE_NAME, buildCorsOptions, createHelmetMiddleware } from '@kumoko/security';
import cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { createValidationPipe } from '../validation/validation-pipe';

export type DocsPath = 'auth' | 'catalog' | 'orders';

export interface BootstrapServiceOptions {
  serviceName: string;
  docsPath: DocsPath;
  docsTitle: string;
  docsDescription: string;
}

/** Rotas fora do prefixo /api (consumidas pelo Docker/Prometheus, nao pelo gateway). */
const ROUTES_WITHOUT_PREFIX = [
  { path: 'health', method: RequestMethod.ALL },
  { path: 'metrics', method: RequestMethod.ALL },
];

function setupSwagger(app: NestExpressApplication, options: BootstrapServiceOptions): void {
  const config = new DocumentBuilder()
    .setTitle(options.docsTitle)
    .setDescription(options.docsDescription)
    .setVersion('1.0.0')
    .addBearerAuth()
    .addCookieAuth(AUTH_COOKIE_NAME)
    .build();
  const docsUrl = `api/${options.docsPath}/docs`;
  SwaggerModule.setup(docsUrl, app, () => SwaggerModule.createDocument(app, config), {
    jsonDocumentUrl: `${docsUrl}-json`,
    swaggerOptions: { persistAuthorization: true },
  });
}

/**
 * Sobe um microsservico com a configuracao padrao do projeto:
 * prefixo /api (exceto /health e /metrics), helmet, CORS com credentials, cookie-parser,
 * trust proxy, ValidationPipe e filtro de erro globais, logger pino, Swagger em
 * /api/<docsPath>/docs, shutdown hooks e listen em 0.0.0.0:PORT.
 */
export async function bootstrapService(
  appModule: IEntryNestModule,
  options: BootstrapServiceOptions,
): Promise<NestExpressApplication> {
  // Durante o boot (antes do pino estar pronto) os logs saem em JSON pelo ConsoleLogger,
  // sem buffer: tentativas de conexao com o banco ficam visiveis imediatamente.
  const app = await NestFactory.create<NestExpressApplication>(appModule, {
    logger: new ConsoleLogger({ json: true, colors: false, prefix: options.serviceName }),
    abortOnError: false,
  });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const port = Number(config.getOrThrow<number>('PORT'));

  // Atras do gateway Nginx: confia no primeiro proxy para obter IP real e protocolo.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.setGlobalPrefix('api', { exclude: ROUTES_WITHOUT_PREFIX });

  app.use(createHelmetMiddleware());
  app.enableCors(buildCorsOptions(config.get<string>('CORS_ORIGINS')));
  app.use(cookieParser());

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  setupSwagger(app, options);
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  new NestLogger('Bootstrap').log(
    `Servico ${options.serviceName} ouvindo na porta ${port} (docs em /api/${options.docsPath}/docs)`,
  );
  return app;
}

/** Atalho para o main.ts: sobe o servico e encerra o processo com erro se o boot falhar. */
export function runService(appModule: IEntryNestModule, options: BootstrapServiceOptions): void {
  bootstrapService(appModule, options).catch((error: unknown) => {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    new NestLogger('Bootstrap').error(`Falha ao iniciar ${options.serviceName}: ${message}`);
    process.exit(1);
  });
}
