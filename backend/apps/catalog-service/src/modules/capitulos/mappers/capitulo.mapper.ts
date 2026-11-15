import type { CapituloResponseDto } from '../dto/capitulo.dto';
import type { Capitulo } from '../entities/capitulo.entity';

export function toCapituloResponse(capitulo: Capitulo, totalPaginas: number): CapituloResponseDto {
  const criadoEm = capitulo.criadoEm instanceof Date ? capitulo.criadoEm : new Date(capitulo.criadoEm);
  return {
    id: capitulo.id,
    obraId: capitulo.obraId,
    numero: Number(capitulo.numero),
    titulo: capitulo.titulo ?? null,
    totalPaginas,
    criadoEm: criadoEm.toISOString(),
  };
}
