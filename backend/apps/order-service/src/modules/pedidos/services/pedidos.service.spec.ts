import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '@kumoko/security';
import type { CatalogClient } from '../../catalogo/catalog.client';
import type { ObraCatalogo } from '../../catalogo/obra-catalogo.translator';
import { Dinheiro } from '../domain/dinheiro';
import { PedidoConcluido } from '../domain/events/pedido-concluido.event';
import { ObraRef } from '../domain/obra-ref';
import { Pedido } from '../domain/pedido';
import { IdempotenciaConflitoError } from '../domain/pedido.errors';
import type { PedidoRepository } from '../domain/pedido.repository';
import { Quantidade } from '../domain/quantidade';
import type { PedidoEventsPublisher } from '../events/pedido.publisher';
import { toOrderCompleted } from '../events/pedido.publisher';
import { PedidosService } from './pedidos.service';

function obraCatalogo(id: number, preco: number): ObraCatalogo {
  return {
    obra: ObraRef.criar({ obraId: id, nome: `Obra ${id}`, tipo: 'manga', capaUrl: null }),
    preco: Dinheiro.fromDecimal(preco),
  };
}

function pedidoPersistido(id: number, usuarioId: number): Pedido {
  const pedido = Pedido.criar(usuarioId, [{ ...obraCatalogo(1, 10), quantidade: Quantidade.de(1) }]);
  pedido.atribuirId(id);
  pedido.pullDomainEvents();
  return pedido;
}

describe('PedidosService', () => {
  let repository: jest.Mocked<PedidoRepository>;
  let catalog: { buscarObras: jest.Mock };
  let publisher: { publicar: jest.Mock };
  let service: PedidosService;
  let nextId: number;

  beforeEach(() => {
    nextId = 100;
    repository = {
      salvar: jest.fn(async (pedido: Pedido) => {
        pedido.atribuirId(nextId++);
        return pedido;
      }),
      buscarPorId: jest.fn(),
      buscarPorIdempotencyKey: jest.fn().mockResolvedValue(null),
      listarPorUsuario: jest.fn(),
      listarTodos: jest.fn(),
    };
    catalog = {
      buscarObras: jest.fn().mockResolvedValue(
        new Map([
          [1, obraCatalogo(1, 29.9)],
          [2, obraCatalogo(2, 19.9)],
        ]),
      ),
    };
    publisher = { publicar: jest.fn().mockResolvedValue(undefined) };
    service = new PedidosService(
      repository,
      catalog as unknown as CatalogClient,
      publisher as unknown as PedidoEventsPublisher,
    );
  });

  it('cria pedido com precos do catalogo, persiste e publica order.completed', async () => {
    const dto = {
      itens: [
        { obraId: 1, quantidade: 2 },
        { obraId: 2, quantidade: 1 },
        { obraId: 1, quantidade: 1 },
      ],
    };
    // Campo extra "preco" do cliente seria barrado pelo ValidationPipe; aqui garantimos que o service o ignora.
    (dto.itens[0] as Record<string, unknown>).preco = 0.01;
    const { pedido, criado } = await service.criar(7, dto);

    expect(criado).toBe(true);
    expect(catalog.buscarObras).toHaveBeenCalledWith([1, 2]);
    expect(pedido).toMatchObject({ id: 100, usuarioId: 7, status: 'CONCLUIDO', total: 109.6 });
    expect(pedido.itens[0]).toMatchObject({ obraId: 1, precoUnitario: 29.9, quantidade: 3, subtotal: 89.7 });

    const eventos = publisher.publicar.mock.calls[0][0];
    expect(eventos).toHaveLength(1);
    expect(toOrderCompleted(eventos[0] as PedidoConcluido)).toEqual({
      pedidoId: 100,
      usuarioId: 7,
      total: 109.6,
      itens: [
        { obraId: 1, quantidade: 3, precoUnitario: 29.9 },
        { obraId: 2, quantidade: 1, precoUnitario: 19.9 },
      ],
    });
  });

  it('mesma Idempotency-Key devolve o pedido existente sem chamar catalogo nem publicar', async () => {
    repository.buscarPorIdempotencyKey.mockResolvedValue(pedidoPersistido(55, 7));
    const { pedido, criado } = await service.criar(7, { itens: [{ obraId: 1, quantidade: 1 }] }, 'chave-1');
    expect(criado).toBe(false);
    expect(pedido.id).toBe(55);
    expect(catalog.buscarObras).not.toHaveBeenCalled();
    expect(repository.salvar).not.toHaveBeenCalled();
    expect(publisher.publicar).not.toHaveBeenCalled();
  });

  it('corrida de idempotencia (UNIQUE) devolve o pedido vencedor', async () => {
    repository.buscarPorIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pedidoPersistido(56, 7));
    repository.salvar.mockRejectedValue(new IdempotenciaConflitoError(7, 'k'));
    const { pedido, criado } = await service.criar(7, { itens: [{ obraId: 1, quantidade: 1 }] }, 'k');
    expect(criado).toBe(false);
    expect(pedido.id).toBe(56);
    expect(publisher.publicar).not.toHaveBeenCalled();
  });

  it('Idempotency-Key invalida -> 400', async () => {
    await expect(
      service.criar(7, { itens: [{ obraId: 1, quantidade: 1 }] }, 'chave invalida'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('obras inexistentes -> 422 listando os ids', async () => {
    const promise = service.criar(7, {
      itens: [
        { obraId: 7, quantidade: 1 },
        { obraId: 1, quantidade: 1 },
        { obraId: 3, quantidade: 1 },
      ],
    });
    await expect(promise).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(promise).rejects.toThrow('Obras não encontradas: 3, 7');
    expect(repository.salvar).not.toHaveBeenCalled();
  });

  it('regra de dominio violada (soma > 99) -> 422', async () => {
    await expect(
      service.criar(7, {
        itens: [
          { obraId: 1, quantidade: 60 },
          { obraId: 1, quantidade: 60 },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('propaga 503 do catalogo', async () => {
    catalog.buscarObras.mockRejectedValue(new ServiceUnavailableException('x'));
    await expect(service.criar(7, { itens: [{ obraId: 1, quantidade: 1 }] })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('listar devolve Paginated', async () => {
    repository.listarPorUsuario.mockResolvedValue({ pedidos: [pedidoPersistido(1, 7)], total: 13 });
    const page = await service.listar(7, { page: 2, limit: 12 });
    expect(repository.listarPorUsuario).toHaveBeenCalledWith(7, { page: 2, limit: 12 });
    expect(page.meta).toEqual({ page: 2, limit: 12, total: 13, totalPages: 2 });
    expect(page.data[0].id).toBe(1);
  });

  describe('obter', () => {
    const dono: AuthenticatedUser = { id: 7, email: 'a@a', nome: 'A', role: 'customer' };
    const outro: AuthenticatedUser = { id: 8, email: 'b@b', nome: 'B', role: 'customer' };
    const admin: AuthenticatedUser = { id: 1, email: 'c@c', nome: 'C', role: 'admin' };

    beforeEach(() => repository.buscarPorId.mockResolvedValue(pedidoPersistido(9, 7)));

    it('dono e admin veem o pedido', async () => {
      await expect(service.obter(9, dono)).resolves.toMatchObject({ id: 9 });
      await expect(service.obter(9, admin)).resolves.toMatchObject({ id: 9 });
    });

    it('outro usuario recebe 404', async () => {
      await expect(service.obter(9, outro)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('inexistente -> 404', async () => {
      repository.buscarPorId.mockResolvedValue(null);
      await expect(service.obter(9, admin)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
