import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { type Paginated, paginate } from '@kumoko/common';
import type { DataSource } from 'typeorm';
import { type FiltroPedidos, PEDIDO_REPOSITORY, type PedidoRepository } from '../domain/pedido.repository';
import type { ResumoVendasResponse, TopObraResponse, VendaDiaResponse } from '../dto/admin-pedidos.dto';
import type { PedidoResponse } from '../dto/pedido-response.dto';
import { toPedidoResponse } from '../mappers/pedido-response.mapper';

const TOP_OBRAS = 5;
const RECENTES = 5;
/** Cache curto em memoria do resumo (painel consultado com frequencia; dados quase em tempo real). */
const RESUMO_TTL_MS = 15_000;
const DIA_MS = 86_400_000;

const num = (valor: unknown): number => Number(valor ?? 0);
const dinheiro = (valor: number): number => Math.round(valor * 100) / 100;

/** Datas YYYY-MM-DD (UTC) dos ultimos `dias` dias, terminando no dia de `hoje`. */
export function diasDoPeriodo(dias: number, hoje: Date = new Date()): string[] {
  const base = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  return Array.from({ length: dias }, (_, i) =>
    new Date(base - (dias - 1 - i) * DIA_MS).toISOString().slice(0, 10),
  );
}

/**
 * Read model administrativo do contexto de Vendas: consultas agregadas (SQL direto)
 * e listagem de todos os pedidos. Nao altera o aggregate.
 */
@Injectable()
export class PedidosAdminService {
  private readonly cache = new Map<number, { expira: number; valor: ResumoVendasResponse }>();

  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly repository: PedidoRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listar(
    filtro: FiltroPedidos,
    pagina: { page: number; limit: number },
  ): Promise<Paginated<PedidoResponse>> {
    const { pedidos, total } = await this.repository.listarTodos(filtro, pagina);
    return paginate(pedidos.map(toPedidoResponse), total, pagina);
  }

  async resumo(dias: number, agora: Date = new Date()): Promise<ResumoVendasResponse> {
    const emCache = this.cache.get(dias);
    if (emCache && emCache.expira > agora.getTime()) {
      return emCache.valor;
    }
    const periodo = diasDoPeriodo(dias, agora);
    const inicio = `${periodo[0]} 00:00:00`;

    const [geral]: Array<Record<string, unknown> | undefined> = await this.dataSource.query(
      `SELECT COALESCE(SUM(p.total),0) AS receita, COUNT(*) AS pedidos, COUNT(DISTINCT p.usuario_id) AS clientes
         FROM pedidos p WHERE p.status = 'CONCLUIDO'`,
    );
    const [itens]: Array<Record<string, unknown> | undefined> = await this.dataSource.query(
      `SELECT COALESCE(SUM(i.quantidade),0) AS unidades
         FROM itens_pedido i JOIN pedidos p ON p.id = i.pedido_id WHERE p.status = 'CONCLUIDO'`,
    );
    const porDia: Array<{ dia: unknown; receita: unknown; pedidos: unknown }> = await this.dataSource.query(
      `SELECT DATE_FORMAT(p.criado_em, '%Y-%m-%d') AS dia, SUM(p.total) AS receita, COUNT(*) AS pedidos
         FROM pedidos p WHERE p.status = 'CONCLUIDO' AND p.criado_em >= ?
        GROUP BY dia`,
      [inicio],
    );
    const top: Array<Record<string, unknown>> = await this.dataSource.query(
      `SELECT i.obra_id AS obraId, MAX(i.nome_obra) AS nome, MAX(i.tipo_obra) AS tipo, MAX(i.capa_url) AS capaUrl,
              SUM(i.quantidade) AS quantidade, SUM(i.preco_unitario * i.quantidade) AS receita
         FROM itens_pedido i JOIN pedidos p ON p.id = i.pedido_id
        WHERE p.status = 'CONCLUIDO' AND p.criado_em >= ?
        GROUP BY i.obra_id ORDER BY quantidade DESC, receita DESC LIMIT ${TOP_OBRAS}`,
      [inicio],
    );
    const recentes = await this.repository.listarTodos({}, { page: 1, limit: RECENTES });

    const mapaDia = new Map(porDia.map((linha) => [String(linha.dia).slice(0, 10), linha]));
    const vendasPorDia: VendaDiaResponse[] = periodo.map((data) => {
      const linha = mapaDia.get(data);
      return { data, receita: dinheiro(num(linha?.receita)), pedidos: num(linha?.pedidos) };
    });
    const topObras: TopObraResponse[] = top.map((linha) => ({
      obraId: num(linha.obraId),
      nome: String(linha.nome),
      tipo: linha.tipo as TopObraResponse['tipo'],
      capaUrl: (linha.capaUrl as string | null) ?? null,
      quantidade: num(linha.quantidade),
      receita: dinheiro(num(linha.receita)),
    }));

    const receitaTotal = dinheiro(num(geral?.receita));
    const totalPedidos = num(geral?.pedidos);
    const valor: ResumoVendasResponse = {
      dias,
      receitaTotal,
      totalPedidos,
      ticketMedio: totalPedidos > 0 ? dinheiro(receitaTotal / totalPedidos) : 0,
      clientesCompradores: num(geral?.clientes),
      itensVendidos: num(itens?.unidades),
      receitaPeriodo: dinheiro(vendasPorDia.reduce((soma, d) => soma + d.receita, 0)),
      pedidosPeriodo: vendasPorDia.reduce((soma, d) => soma + d.pedidos, 0),
      vendasPorDia,
      topObras,
      pedidosRecentes: recentes.pedidos.map(toPedidoResponse),
    };
    this.cache.set(dias, { expira: agora.getTime() + RESUMO_TTL_MS, valor });
    return valor;
  }
}
