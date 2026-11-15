import { http } from './http.js';

// Remove parametros vazios para nao poluir a query (e a chave de cache do backend).
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

// catalog-service: obras, capitulos e paginas.
export const catalogService = {
  // params: { tipo?, genero?, busca?, ordenar?, page?, limit? } -> Paginated<ObraResponse>
  async listObras(params) {
    const { data } = await http.get('/obras', { params: cleanParams(params) });
    return data;
  },

  // [{ genero, total }] do mais comum ao menos comum
  async listGeneros() {
    const { data } = await http.get('/obras/generos');
    return data;
  },

  // Obras com generos em comum / mesmo tipo (exclui a propria obra)
  async getRelacionadas(id, limit = 6) {
    const { data } = await http.get(`/obras/${id}/relacionadas`, { params: { limit } });
    return data;
  },

  async getObrasLote(ids) {
    if (!ids.length) return [];
    const { data } = await http.get('/obras/lote', { params: { ids: ids.join(',') } });
    return data;
  },

  async getObra(id) {
    const { data } = await http.get(`/obras/${id}`);
    return data;
  },

  // formData multipart: tipo, nome, autor, descricao, volume, preco, avaliacao, capa
  async createObra(formData) {
    const { data } = await http.post('/obras', formData);
    return data;
  },

  async updateObra(id, formData) {
    const { data } = await http.patch(`/obras/${id}`, formData);
    return data;
  },

  async deleteObra(id) {
    await http.delete(`/obras/${id}`);
  },

  async listCapitulos(obraId) {
    const { data } = await http.get(`/obras/${obraId}/capitulos`);
    return data;
  },

  async createCapitulo(obraId, { numero, titulo }) {
    const { data } = await http.post(`/obras/${obraId}/capitulos`, { numero, titulo });
    return data;
  },

  async updateCapitulo(id, body) {
    const { data } = await http.patch(`/capitulos/${id}`, body);
    return data;
  },

  async deleteCapitulo(id) {
    await http.delete(`/capitulos/${id}`);
  },

  async listPaginas(capituloId) {
    const { data } = await http.get(`/capitulos/${capituloId}/paginas`);
    return data;
  },

  // Upload de uma pagina por requisicao (campo "imagem"); numero opcional.
  // onProgress(0..100) recebe o progresso do envio (axios onUploadProgress).
  async uploadPagina(capituloId, file, numero, { onProgress } = {}) {
    const formData = new FormData();
    formData.append('imagem', file);
    if (numero !== undefined && numero !== null && numero !== '') formData.append('numero', String(numero));
    const { data } = await http.post(`/capitulos/${capituloId}/paginas`, formData, {
      timeout: 120000,
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.min(100, Math.round((e.loaded / e.total) * 100)) : 0)
        : undefined,
    });
    return data;
  },

  // paginaIds: todos os ids das paginas na nova ordem -> PaginaResponse[] renumeradas 1..N.
  async reordenarPaginas(capituloId, paginaIds) {
    const { data } = await http.put(`/capitulos/${capituloId}/paginas/ordem`, { paginaIds });
    return data;
  },

  async deletePagina(id) {
    await http.delete(`/paginas/${id}`);
  },
};
