import { ObraDomainError } from './obra-domain.error';

export const LOTE_MAX_IDS = 50;
const MAX_INT = 2_147_483_647;

/**
 * Converte `ids=1,2,3` em lista de inteiros positivos unicos (ordem preservada).
 * Lanca ObraDomainError (400) se vazio, com valor invalido ou com mais de LOTE_MAX_IDS ids.
 */
export function parseLoteIds(raw: unknown): number[] {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new ObraDomainError('Informe ao menos um id no parâmetro ids (ex.: ids=1,2,3).');
  }
  const partes = raw.split(',').map((parte) => parte.trim());
  const ids: number[] = [];
  for (const parte of partes) {
    if (!/^\d{1,10}$/.test(parte)) {
      throw new ObraDomainError(`Id inválido no parâmetro ids: "${parte.slice(0, 20)}".`);
    }
    const id = Number(parte);
    if (id < 1 || id > MAX_INT) {
      throw new ObraDomainError(`Id inválido no parâmetro ids: "${parte}".`);
    }
    if (!ids.includes(id)) {
      ids.push(id);
    }
  }
  if (ids.length > LOTE_MAX_IDS) {
    throw new ObraDomainError(`Informe no máximo ${LOTE_MAX_IDS} ids por consulta.`);
  }
  return ids;
}
