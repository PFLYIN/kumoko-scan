import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { toSkipTake } from '@kumoko/common';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import type { IdempotencyKey } from '../domain/idempotency-key';
import type { Pedido } from '../domain/pedido';
import { IdempotenciaConflitoError } from '../domain/pedido.errors';
import type { PaginaPedidos, PedidoRepository } from '../domain/pedido.repository';
import { ItemPedidoEntity } from '../entities/item-pedido.entity';
import { PedidoEntity } from '../entities/pedido.entity';
import { PedidoPersistenceMapper } from '../mappers/pedido-persistence.mapper';

const MYSQL_DUPLICATE_ENTRY = 1062;

/** Detecta violacao de UNIQUE do MariaDB/MySQL (ER_DUP_ENTRY). */
export function isDuplicateEntryError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = error.driverError as { code?: unknown; errno?: unknown } | undefined;
  return driverError?.code === 'ER_DUP_ENTRY' || driverError?.errno === MYSQL_DUPLICATE_ENTRY;
}

/** Adapter TypeORM do port PedidoRepository. */
@Injectable()
export class TypeOrmPedidoRepository implements PedidoRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PedidoEntity) private readonly pedidos: Repository<PedidoEntity>,
    @InjectRepository(ItemPedidoEntity) private readonly itens: Repository<ItemPedidoEntity>,
  ) {}

  async salvar(pedido: Pedido): Promise<Pedido> {
    let pedidoId: number;
    try {
      // Raiz + itens na mesma transacao: o aggregate e gravado inteiro ou nada.
      pedidoId = await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(PedidoEntity, PedidoPersistenceMapper.toPedidoEntity(pedido));
        await manager.save(ItemPedidoEntity, PedidoPersistenceMapper.toItemEntities(pedido, saved.id));
        return saved.id;
      });
    } catch (error) {
      if (pedido.idempotencyKey && isDuplicateEntryError(error)) {
        throw new IdempotenciaConflitoError(pedido.usuarioId, pedido.idempotencyKey.valor);
      }
      throw error;
    }
    pedido.atribuirId(pedidoId);
    return pedido;
  }

  async buscarPorId(id: number): Promise<Pedido | null> {
    const entity = await this.pedidos.findOne({ where: { id } });
    return entity ? this.hidratar(entity) : null;
  }

  async buscarPorIdempotencyKey(usuarioId: number, chave: IdempotencyKey): Promise<Pedido | null> {
    const entity = await this.pedidos.findOne({ where: { usuarioId, idempotencyKey: chave.valor } });
    return entity ? this.hidratar(entity) : null;
  }

  async listarPorUsuario(usuarioId: number, pagina: { page: number; limit: number }): Promise<PaginaPedidos> {
    const [entities, total] = await this.pedidos.findAndCount({
      where: { usuarioId },
      order: { criadoEm: 'DESC', id: 'DESC' },
      ...toSkipTake(pagina),
    });
    if (entities.length === 0) {
      return { pedidos: [], total };
    }
    // Itens da pagina em uma unica consulta (evita N+1 e o DISTINCT do skip/take com join).
    const itens = await this.itens.find({
      where: { pedidoId: In(entities.map((entity) => entity.id)) },
      order: { id: 'ASC' },
    });
    const porPedido = new Map<number, ItemPedidoEntity[]>();
    for (const item of itens) {
      const lista = porPedido.get(item.pedidoId) ?? [];
      lista.push(item);
      porPedido.set(item.pedidoId, lista);
    }
    return {
      pedidos: entities.map((entity) =>
        PedidoPersistenceMapper.toDomain(entity, porPedido.get(entity.id) ?? []),
      ),
      total,
    };
  }

  private async hidratar(entity: PedidoEntity): Promise<Pedido> {
    const itens = await this.itens.find({ where: { pedidoId: entity.id }, order: { id: 'ASC' } });
    return PedidoPersistenceMapper.toDomain(entity, itens);
  }
}
