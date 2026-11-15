import { Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type Paginated, paginate } from '@kumoko/common';
import type { AuthenticatedUser } from '@kumoko/security';
import { CatalogClient } from '../../catalogo/catalog.client';
import { DomainError } from '../domain/domain-error';
import { IdempotencyKey } from '../domain/idempotency-key';
import { type LinhaPedido, Pedido } from '../domain/pedido';
import { IdempotenciaConflitoError } from '../domain/pedido.errors';
import { PEDIDO_REPOSITORY, type PedidoRepository } from '../domain/pedido.repository';
import { Quantidade } from '../domain/quantidade';
import type { CriarPedidoDto } from '../dto/criar-pedido.dto';
import type { PedidoResponse } from '../dto/pedido-response.dto';
import { PedidoEventsPublisher } from '../events/pedido.publisher';
import { domainErrorToHttp } from '../filters/domain-error.mapper';
import { toPedidoResponse } from '../mappers/pedido-response.mapper';

export interface CriarPedidoResultado {
  pedido: PedidoResponse;
  /** false quando a mesma Idempotency-Key devolveu um pedido ja existente (HTTP 200). */
  criado: boolean;
}

/** Casos de uso do contexto de Vendas: criar, listar e obter pedidos. */
@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly repository: PedidoRepository,
    private readonly catalog: CatalogClient,
    private readonly publisher: PedidoEventsPublisher,
  ) {}

  async criar(
    usuarioId: number,
    dto: CriarPedidoDto,
    idempotencyHeader?: string,
  ): Promise<CriarPedidoResultado> {
    const chave = this.dominio(() => IdempotencyKey.opcional(idempotencyHeader));

    // Idempotencia: mesma chave + mesmo usuario -> devolve o pedido ja criado.
    if (chave) {
      const existente = await this.repository.buscarPorIdempotencyKey(usuarioId, chave);
      if (existente) {
        this.logger.log(
          `Pedido idempotente reutilizado pedidoId=${existente.id} usuarioId=${usuarioId} chave=${chave.valor}`,
        );
        return { pedido: toPedidoResponse(existente), criado: false };
      }
    }

    const ids = [...new Set(dto.itens.map((item) => item.obraId))];
    const obras = await this.catalog.buscarObras(ids);
    const inexistentes = ids.filter((id) => !obras.has(id)).sort((a, b) => a - b);
    if (inexistentes.length > 0) {
      this.logger.warn(
        `Pedido recusado: obras inexistentes ids=${inexistentes.join(',')} usuarioId=${usuarioId}`,
      );
      throw new UnprocessableEntityException(`Obras não encontradas: ${inexistentes.join(', ')}`);
    }

    // Preco SEMPRE do catalogo: o cliente informa apenas obra e quantidade.
    const pedido = this.dominio(() => {
      const linhas: LinhaPedido[] = dto.itens.map((item) => {
        const obra = obras.get(item.obraId)!;
        return { obra: obra.obra, preco: obra.preco, quantidade: Quantidade.de(item.quantidade) };
      });
      return Pedido.criar(usuarioId, linhas, { idempotencyKey: chave });
    });

    try {
      await this.repository.salvar(pedido);
    } catch (error) {
      if (error instanceof IdempotenciaConflitoError && chave) {
        // Corrida entre requisicoes com a mesma chave: a outra venceu.
        const existente = await this.repository.buscarPorIdempotencyKey(usuarioId, chave);
        if (existente) {
          this.logger.log(`Pedido idempotente (corrida) pedidoId=${existente.id} usuarioId=${usuarioId}`);
          return { pedido: toPedidoResponse(existente), criado: false };
        }
      }
      throw error;
    }

    this.logger.log(
      `Pedido criado pedidoId=${pedido.id} usuarioId=${usuarioId} itens=${pedido.itens.length} total=${pedido.total.toString()}`,
    );
    await this.publisher.publicar(pedido.pullDomainEvents());
    return { pedido: toPedidoResponse(pedido), criado: true };
  }

  async listar(
    usuarioId: number,
    pagina: { page: number; limit: number },
  ): Promise<Paginated<PedidoResponse>> {
    const { pedidos, total } = await this.repository.listarPorUsuario(usuarioId, pagina);
    return paginate(pedidos.map(toPedidoResponse), total, pagina);
  }

  /** Dono ou admin; para os demais responde 404 (nao revela a existencia do pedido). */
  async obter(id: number, usuario: AuthenticatedUser): Promise<PedidoResponse> {
    const pedido = await this.repository.buscarPorId(id);
    if (!pedido || (usuario.role !== 'admin' && !pedido.pertenceA(usuario.id))) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    return toPedidoResponse(pedido);
  }

  /** Executa regra de dominio convertendo DomainError em 400/422. */
  private dominio<T>(fn: () => T): T {
    try {
      return fn();
    } catch (error) {
      if (error instanceof DomainError) {
        throw domainErrorToHttp(error);
      }
      throw error;
    }
  }
}
