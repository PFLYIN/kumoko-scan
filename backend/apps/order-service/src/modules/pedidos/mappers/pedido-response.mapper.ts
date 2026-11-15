import type { Pedido } from '../domain/pedido';
import type { PedidoResponse } from '../dto/pedido-response.dto';

/** Aggregate -> contrato HTTP (PedidoResponse). */
export function toPedidoResponse(pedido: Pedido): PedidoResponse {
  if (pedido.id === null) {
    throw new Error('Pedido sem identidade nao pode ser serializado.');
  }
  return {
    id: pedido.id,
    usuarioId: pedido.usuarioId,
    status: pedido.status,
    total: pedido.total.toNumber(),
    itens: pedido.itens.map((item) => ({
      obraId: item.obraId,
      nome: item.obra.nome,
      tipo: item.obra.tipo,
      capaUrl: item.obra.capaUrl,
      precoUnitario: item.precoUnitario.toNumber(),
      quantidade: item.quantidade.valor,
      subtotal: item.subtotal.toNumber(),
    })),
    criadoEm: pedido.criadoEm.toISOString(),
  };
}
