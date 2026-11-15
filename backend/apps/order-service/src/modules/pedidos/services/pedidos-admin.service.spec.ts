import type { DataSource } from 'typeorm';
import type { PedidoRepository } from '../domain/pedido.repository';
import { PedidosAdminService, diasDoPeriodo } from './pedidos-admin.service';

describe('diasDoPeriodo', () => {
  it('gera N dias terminando hoje (UTC), em ordem', () => {
    expect(diasDoPeriodo(3, new Date('2026-03-01T15:00:00Z'))).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
  });
});

describe('PedidosAdminService.resumo', () => {
  const agora = new Date('2026-11-15T12:00:00Z');
  let query: jest.Mock;
  let repository: { listarTodos: jest.Mock };
  let service: PedidosAdminService;

  beforeEach(() => {
    query = jest
      .fn()
      .mockResolvedValueOnce([{ receita: '100.00', pedidos: 3, clientes: 2 }])
      .mockResolvedValueOnce([{ unidades: '7' }])
      .mockResolvedValueOnce([{ dia: '2026-11-15', receita: '40.50', pedidos: 2 }])
      .mockResolvedValueOnce([
        { obraId: 3, nome: 'Dandadan', tipo: 'manga', capaUrl: null, quantidade: '4', receita: '80.00' },
      ]);
    repository = { listarTodos: jest.fn().mockResolvedValue({ pedidos: [], total: 0 }) };
    service = new PedidosAdminService(
      repository as unknown as PedidoRepository,
      { query } as unknown as DataSource,
    );
  });

  it('calcula KPIs, preenche dias vazios e mapeia top obras', async () => {
    const r = await service.resumo(3, agora);
    expect(r).toMatchObject({
      dias: 3,
      receitaTotal: 100,
      totalPedidos: 3,
      ticketMedio: 33.33,
      clientesCompradores: 2,
      itensVendidos: 7,
      receitaPeriodo: 40.5,
      pedidosPeriodo: 2,
    });
    expect(r.vendasPorDia).toEqual([
      { data: '2026-11-13', receita: 0, pedidos: 0 },
      { data: '2026-11-14', receita: 0, pedidos: 0 },
      { data: '2026-11-15', receita: 40.5, pedidos: 2 },
    ]);
    expect(r.topObras[0]).toEqual({
      obraId: 3,
      nome: 'Dandadan',
      tipo: 'manga',
      capaUrl: null,
      quantidade: 4,
      receita: 80,
    });
    expect(query.mock.calls[2][1]).toEqual(['2026-11-13 00:00:00']);
  });

  it('usa cache curto na segunda chamada', async () => {
    await service.resumo(3, agora);
    await service.resumo(3, new Date(agora.getTime() + 1000));
    expect(query).toHaveBeenCalledTimes(4);
  });

  it('ticket medio zero sem pedidos', async () => {
    query.mockReset().mockResolvedValue([]);
    const r = await service.resumo(1, agora);
    expect(r.ticketMedio).toBe(0);
    expect(r.vendasPorDia).toHaveLength(1);
  });
});
