import { toPublicFileUrl } from '../../../shared/storage/public-url';
import type { ObraResponseDto } from '../dto/obra-response.dto';
import type { Obra } from '../entities/obra.entity';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** Entity -> resposta publica (sem caminhos internos de disco). */
export function toObraResponse(obra: Obra): ObraResponseDto {
  return {
    id: obra.id,
    tipo: obra.tipo,
    nome: obra.nome,
    autor: obra.autor,
    descricao: obra.descricao,
    volume: obra.volume,
    preco: Number(obra.preco),
    avaliacao: Number(obra.avaliacao),
    capaUrl: toPublicFileUrl(obra.capaPath),
    totalVendido: Number(obra.totalVendido ?? 0),
    criadoEm: toIso(obra.criadoEm),
    atualizadoEm: toIso(obra.atualizadoEm),
  };
}
