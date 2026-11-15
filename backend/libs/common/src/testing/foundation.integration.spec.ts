import { Controller, Get, type INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  AUTH_COOKIE_NAME,
  type AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
  SecurityModule,
  toJwtPayload,
} from '@kumoko/security';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';

@Controller('demo')
class DemoController {
  @Public()
  @Get('publico')
  publico() {
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Roles('admin')
  @Get('admin')
  admin() {
    return { admin: true };
  }

  @Public()
  @Get('quebra')
  quebra() {
    throw new Error('detalhe interno que nao pode vazar');
  }
}

/** Sobe uma app Nest real (DI, guards globais, filtro) para validar a fundacao das libs. */
describe('Fundacao (integracao): SecurityModule + AllExceptionsFilter', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const customer: AuthenticatedUser = { id: 2, email: 'c@k.local', nome: 'Cliente', role: 'customer' };
  const admin: AuthenticatedUser = { id: 1, email: 'a@k.local', nome: 'Admin', role: 'admin' };

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({ JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres', JWT_EXPIRES_IN: '1h' }),
          ],
        }),
        SecurityModule.forRoot(),
      ],
      controllers: [DemoController],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('rota publica responde sem token', async () => {
    await request(app.getHttpServer()).get('/api/demo/publico').expect(200, { ok: true });
  });

  it('rota protegida sem token responde 401 no formato padrao', async () => {
    const res = await request(app.getHttpServer()).get('/api/demo/me').expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized', path: '/api/demo/me' });
  });

  it('aceita o token via cookie httpOnly e injeta @CurrentUser()', async () => {
    const token = jwt.sign(toJwtPayload(customer));
    const res = await request(app.getHttpServer())
      .get('/api/demo/me')
      .set('Cookie', `${AUTH_COOKIE_NAME}=${token}`)
      .expect(200);
    expect(res.body).toEqual(customer);
  });

  it('@Roles("admin") nega customer (403) e libera admin', async () => {
    await request(app.getHttpServer())
      .get('/api/demo/admin')
      .set('Authorization', `Bearer ${jwt.sign(toJwtPayload(customer))}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/demo/admin')
      .set('Authorization', `Bearer ${jwt.sign(toJwtPayload(admin))}`)
      .expect(200, { admin: true });
  });

  it('erro inesperado vira 500 sem vazar detalhe', async () => {
    const res = await request(app.getHttpServer()).get('/api/demo/quebra').expect(500);
    expect(JSON.stringify(res.body)).not.toContain('detalhe interno');
  });
});
