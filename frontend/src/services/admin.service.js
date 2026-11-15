import { http } from './http.js';

const limpar = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

// Endpoints exclusivos do administrador (order-service e auth-service).
export const adminService = {
  // ResumoVendas: KPIs, vendasPorDia, topObras, pedidosRecentes
  async resumoVendas(dias = 30) {
    const { data } = await http.get('/pedidos/admin/resumo', { params: { dias } });
    return data;
  },

  // params: { page, limit, status?, usuarioId? } -> Paginated<PedidoResponse>
  async listarPedidos(params) {
    const { data } = await http.get('/pedidos/admin', { params: limpar(params) });
    return data;
  },

  async resumoUsuarios() {
    const { data } = await http.get('/users/admin/resumo');
    return data;
  },

  // params: { page, limit, busca?, role?, ordenar? } -> Paginated<UsuarioResponse>
  async listarUsuarios(params) {
    const { data } = await http.get('/users/admin', { params: limpar(params) });
    return data;
  },

  async alterarRole(id, role) {
    const { data } = await http.patch(`/users/${id}/role`, { role });
    return data;
  },
};
