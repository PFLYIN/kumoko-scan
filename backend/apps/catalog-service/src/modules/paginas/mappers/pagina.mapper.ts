import { toPublicFileUrl } from '../../../shared/storage/public-url';
import type { PaginaResponseDto } from '../dto/pagina.dto';
import type { Pagina } from '../entities/pagina.entity';

export function toPaginaResponse(pagina: Pagina): PaginaResponseDto {
  return {
    id: pagina.id,
    capituloId: pagina.capituloId,
    numero: pagina.numero,
    imagemUrl: toPublicFileUrl(pagina.imagemPath) ?? '',
  };
}
