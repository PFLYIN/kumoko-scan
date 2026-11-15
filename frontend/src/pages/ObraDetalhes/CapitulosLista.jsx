import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatData, formatNumeroCapitulo } from '../../utils/format.js';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

// Lista de capitulos disponiveis para leitura online.
export default function CapitulosLista({ obraId }) {
  const { data: capitulos, loading, error, reload } = useFetch(() => catalogService.listCapitulos(obraId), [obraId]);

  return (
    <section aria-labelledby="capitulos-titulo" className="mt-12">
      <h2 id="capitulos-titulo" className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
        <BookOpen className="size-5 text-brand-400" aria-hidden="true" /> Capítulos
      </h2>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-zinc-400" role="status">
          <Spinner className="size-4" /> Carregando capítulos...
        </p>
      )}
      {!loading && error && <ErrorState error={error} onRetry={reload} title="Não foi possível carregar os capítulos" />}
      {!loading && !error && capitulos?.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
          Nenhum capítulo disponível para leitura online ainda.
        </p>
      )}
      {!loading && !error && capitulos?.length > 0 && (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-ink-850">
          {capitulos.map((cap) => (
            <li key={cap.id}>
              <Link
                to={`/obras/${obraId}/capitulos/${cap.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/5"
              >
                <span className="min-w-0">
                  <span className="font-medium text-zinc-100">Capítulo {formatNumeroCapitulo(cap.numero)}</span>
                  {cap.titulo && <span className="text-zinc-400"> - {cap.titulo}</span>}
                  <span className="block text-xs text-zinc-500">
                    {cap.totalPaginas} página(s) - {formatData(cap.criadoEm)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
