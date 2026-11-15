import {
  type CanActivate,
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PedidosService } from '../services/pedidos.service';
import { PedidosController } from './pedidos.controller';

/** Guard de teste: simula o JwtAuthGuard lendo o usuario do header x-test-user. */
class FakeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const raw = req.headers['x-test-user'];
    if (!raw) {
      throw new UnauthorizedException();
    }
    req.user = JSON.parse(raw as string);
    return true;
  }
}

const USER = JSON.stringify({ id: 7, email: 'a@a', nome: 'A', role: 'customer' });
const PEDIDO = {
  id: 1,
  usuarioId: 7,
  status: 'CONCLUIDO',
  total: 10,
  itens: [],
  criadoEm: '2026-01-01T00:00:00.000Z',
};

describe('PedidosController (e2e leve)', () => {
  let app: INestApplication;
  const service = { criar: jest.fn(), listar: jest.fn(), obter: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        { provide: PedidosService, useValue: service },
        { provide: APP_GUARD, useClass: FakeAuthGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST novo -> 201 e repassa Idempotency-Key', async () => {
    service.criar.mockResolvedValue({ pedido: PEDIDO, criado: true });
    const res = await request(app.getHttpServer())
      .post('/pedidos')
      .set('x-test-user', USER)
      .set('Idempotency-Key', 'k-1')
      .send({ itens: [{ obraId: 1, quantidade: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(PEDIDO);
    expect(service.criar).toHaveBeenCalledWith(7, { itens: [{ obraId: 1, quantidade: 2 }] }, 'k-1');
  });

  it('POST idempotente -> 200', async () => {
    service.criar.mockResolvedValue({ pedido: PEDIDO, criado: false });
    const res = await request(app.getHttpServer())
      .post('/pedidos')
      .set('x-test-user', USER)
      .send({ itens: [{ obraId: 1, quantidade: 1 }] });
    expect(res.status).toBe(200);
  });

  it.each([
    [{ itens: [] }],
    [{ itens: [{ obraId: 1, quantidade: 100 }] }],
    [{ itens: [{ obraId: 0, quantidade: 1 }] }],
    [{ itens: [{ obraId: 1, quantidade: 1, preco: 0.01 }] }],
    [{ itens: Array.from({ length: 21 }, (_, i) => ({ obraId: i + 1, quantidade: 1 })) }],
  ])('POST invalido -> 400 (%#)', async (body) => {
    const res = await request(app.getHttpServer()).post('/pedidos').set('x-test-user', USER).send(body);
    expect(res.status).toBe(400);
    expect(service.criar).not.toHaveBeenCalled();
  });

  it('sem usuario -> 401', async () => {
    const res = await request(app.getHttpServer()).get('/pedidos');
    expect(res.status).toBe(401);
  });

  it('GET /pedidos aplica paginacao padrao', async () => {
    service.listar.mockResolvedValue({ data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    const res = await request(app.getHttpServer()).get('/pedidos').set('x-test-user', USER);
    expect(res.status).toBe(200);
    expect(service.listar).toHaveBeenCalledWith(7, { page: 1, limit: 12 });
  });

  it('GET /pedidos/:id valida o id', async () => {
    service.obter.mockResolvedValue(PEDIDO);
    expect((await request(app.getHttpServer()).get('/pedidos/abc').set('x-test-user', USER)).status).toBe(
      400,
    );
    const res = await request(app.getHttpServer()).get('/pedidos/1').set('x-test-user', USER);
    expect(res.status).toBe(200);
    expect(service.obter).toHaveBeenCalledWith(1, expect.objectContaining({ id: 7 }));
  });
});
