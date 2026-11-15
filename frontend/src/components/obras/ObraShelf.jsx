import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { catalogService } from '../../services/catalog.service.js';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import ObraGrid from './ObraGrid.jsx';
import ObraGridSkeleton from './ObraGridSkeleton.jsx';

// Secao da Home: busca uma vitrine de obras com a ordenacao informada.
export default function ObraShelf({ title, ordenar, limit = 6, verTodosHref }) {
  const { data, loading, error, reload } = useFetch(
    () => catalogService.listObras({ ordenar, limit, page: 1 }),
    [ordenar, limit],
  );
  const headingId = `shelf-${ordenar}`;

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="h-px w-8 bg-brand-500/60" aria-hidden="true" />
          <h2 id={headingId} className="text-lg font-light tracking-[0.2em] text-zinc-200 uppercase">
            {title}
          </h2>
        </div>
        {verTodosHref && (
          <Link to={verTodosHref} className="inline-flex items-center gap-1 text-sm text-brand-300 hover:text-brand-400">
            Ver todos
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {loading && <ObraGridSkeleton count={limit} />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data?.data?.length === 0 && (
        <EmptyState title="Nenhuma obra por aqui ainda" description="O acervo está sendo preparado. Volte em breve." />
      )}
      {!loading && !error && data?.data?.length > 0 && <ObraGrid obras={data.data} />}
    </section>
  );
}
