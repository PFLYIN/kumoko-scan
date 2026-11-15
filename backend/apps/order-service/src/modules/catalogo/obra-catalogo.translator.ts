import { Dinheiro } from '../pedidos/domain/dinheiro';
import { ObraRef } from '../pedidos/domain/obra-ref';
import { TIPOS_OBRA, type TipoObra } from '../pedidos/domain/pedido.constants';

/**
 * Anti-Corruption Layer: o order-service so precisa de 5 campos do `ObraResponse` do catalogo.
 * Esta e a forma serializavel (cacheada no Redis) desse recorte.
 */
export interface ObraCatalogoSnapshot {
  obraId: number;
  nome: string;
  tipo: TipoObra;
  capaUrl: string | null;
  precoCentavos: number;
}

/** Obra ja traduzida para o modelo do contexto de Vendas. */
export interface ObraCatalogo {
  obra: ObraRef;
  preco: Dinheiro;
}

export class CatalogRespostaInvalidaError extends Error {
  constructor(motivo: string) {
    super(`Resposta invalida do catalogo: ${motivo}`);
    this.name = 'CatalogRespostaInvalidaError';
  }
}

function toPrecoNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return Number.NaN;
}

/**
 * Traduz o corpo de `GET /api/obras/lote` para snapshots. Campos que o pedido nao usa
 * (descricao, avaliacao, totalVendido...) sao ignorados de proposito.
 */
export function translateLoteResponse(body: unknown): ObraCatalogoSnapshot[] {
  if (!Array.isArray(body)) {
    throw new CatalogRespostaInvalidaError('esperado um array de obras');
  }
  return body.map((raw: unknown, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new CatalogRespostaInvalidaError(`item ${index} nao e um objeto`);
    }
    const data = raw as Record<string, unknown>;
    const obraId = data.id;
    if (typeof obraId !== 'number' || !Number.isSafeInteger(obraId) || obraId <= 0) {
      throw new CatalogRespostaInvalidaError(`item ${index} sem id valido`);
    }
    if (typeof data.nome !== 'string' || data.nome.trim() === '') {
      throw new CatalogRespostaInvalidaError(`obra ${obraId} sem nome`);
    }
    if (typeof data.tipo !== 'string' || !(TIPOS_OBRA as readonly string[]).includes(data.tipo)) {
      throw new CatalogRespostaInvalidaError(`obra ${obraId} com tipo invalido`);
    }
    const preco = toPrecoNumber(data.preco);
    if (!Number.isFinite(preco) || preco < 0) {
      throw new CatalogRespostaInvalidaError(`obra ${obraId} com preco invalido`);
    }
    return {
      obraId,
      nome: data.nome,
      tipo: data.tipo as TipoObra,
      capaUrl: typeof data.capaUrl === 'string' && data.capaUrl.length > 0 ? data.capaUrl : null,
      precoCentavos: Dinheiro.fromDecimal(preco).centavos,
    };
  });
}

/** Snapshot (cache) -> Value Objects do dominio de Vendas. */
export function toObraCatalogo(snapshot: ObraCatalogoSnapshot): ObraCatalogo {
  return {
    obra: ObraRef.criar({
      obraId: snapshot.obraId,
      nome: snapshot.nome,
      tipo: snapshot.tipo,
      capaUrl: snapshot.capaUrl,
    }),
    preco: Dinheiro.fromCentavos(snapshot.precoCentavos),
  };
}
