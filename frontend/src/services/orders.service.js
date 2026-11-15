import { http } from './http.js';

// order-service: o cliente envia apenas obraId + quantidade; o preco vem do catalogo.
export const ordersService = {
  async createPedido(itens, idempotencyKey) {
    const { data } = await http.post(
      '/pedidos',
      { itens: itens.map(({ obraId, quantidade }) => ({ obraId, quantidade })) },
      { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined },
    );
    return data;
  },

  // Paginated<PedidoResponse>, mais recentes primeiro
  async listPedidos({ page = 1, limit = 10 } = {}) {
    const { data } = await http.get('/pedidos', { params: { page, limit } });
    return data;
  },

  async getPedido(id) {
    const { data } = await http.get(`/pedidos/${id}`);
    return data;
  },
};
