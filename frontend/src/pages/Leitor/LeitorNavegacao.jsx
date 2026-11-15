import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { formatNumeroCapitulo } from '../../utils/format.js';

export default function LeitorNavegacao({ obraId, anterior, proximo }) {
  return (
    <nav aria-label="Navegação entre capítulos" className="flex items-center justify-between gap-2 px-2">
      {anterior ? (
        <Link to={`/obras/${obraId}/capitulos/${anterior.id}`} className="btn-secondary">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Anterior: cap. {formatNumeroCapitulo(anterior.numero)}</span>
        </Link>
      ) : (
        <span />
      )}
      <Link to={`/obras/${obraId}`} className="btn-secondary px-3" aria-label="Lista de capítulos">
        <List className="size-4" aria-hidden="true" />
      </Link>
      {proximo ? (
        <Link to={`/obras/${obraId}/capitulos/${proximo.id}`} className="btn-primary">
          <span>Próximo: cap. {formatNumeroCapitulo(proximo.numero)}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
