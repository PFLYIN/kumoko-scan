import { BadRequestException, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ObrasService } from '../services/obras.service';
import { ObrasController } from './obras.controller';

/** Teste HTTP leve do controller (camada de servico/persistencia mockada; guards nao registrados). */
describe('ObrasController (HTTP)', () => {
  let app: INestApplication;
  const service = {
    list: jest.fn(),
    findById: jest.fn(),
    findLote: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ObrasController],
      providers: [{ provide: ObrasService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('GET /obras seta X-Cache e repassa filtros convertidos', async () => {
    service.list.mockResolvedValue({
      value: { data: [], meta: { page: 2, limit: 5, total: 0, totalPages: 0 } },
      hit: true,
    });
    const res = await request(app.getHttpServer()).get('/obras?tipo=manga&page=2&limit=5').expect(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'manga', page: 2, limit: 5 }));
  });

  it('GET /obras com filtro invalido -> 400', async () => {
    await request(app.getHttpServer()).get('/obras?ordenar=xyz').expect(400);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('GET /obras/lote nao cai na rota :id', async () => {
    service.findLote.mockResolvedValue([{ id: 1 }]);
    await request(app.getHttpServer())
      .get('/obras/lote?ids=1,2,999')
      .expect(200, [{ id: 1 }]);
    expect(service.findLote).toHaveBeenCalledWith('1,2,999');
    expect(service.findById).not.toHaveBeenCalled();
  });

  it('GET /obras/lote com ids invalidos -> 400', async () => {
    service.findLote.mockRejectedValue(new BadRequestException('Id inválido'));
    await request(app.getHttpServer()).get('/obras/lote?ids=a').expect(400);
  });

  it('GET /obras/:id com id invalido -> 400 e valido -> MISS', async () => {
    await request(app.getHttpServer()).get('/obras/abc').expect(400);
    service.findById.mockResolvedValue({ value: { id: 1 }, hit: false });
    const res = await request(app.getHttpServer()).get('/obras/1').expect(200);
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('POST /obras multipart converte campos e repassa o arquivo', async () => {
    service.create.mockResolvedValue({ id: 5 });
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
    await request(app.getHttpServer())
      .post('/obras')
      .field('tipo', 'manga')
      .field('nome', 'Nova')
      .field('preco', '19.90')
      .field('autor', '')
      .attach('capa', jpg, { filename: 'capa.jpg', contentType: 'image/jpeg' })
      .expect(201);
    const [dto, file] = service.create.mock.calls[0] as [Record<string, unknown>, Express.Multer.File];
    expect(dto).toMatchObject({ tipo: 'manga', nome: 'Nova', preco: 19.9, autor: null });
    expect(file.buffer.length).toBe(20);
  });

  it('POST /obras com arquivo de extensao nao permitida -> 400', async () => {
    await request(app.getHttpServer())
      .post('/obras')
      .field('tipo', 'manga')
      .field('nome', 'Nova')
      .field('preco', '10')
      .attach('capa', Buffer.from('texto'), { filename: 'capa.txt', contentType: 'text/plain' })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('DELETE /obras/:id -> 204', async () => {
    service.remove.mockResolvedValue(undefined);
    await request(app.getHttpServer()).delete('/obras/3').expect(204);
    expect(service.remove).toHaveBeenCalledWith(3);
  });
});
