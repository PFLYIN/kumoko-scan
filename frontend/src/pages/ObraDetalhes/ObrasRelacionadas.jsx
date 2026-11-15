import { Sparkles } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { catalogService } from '../../services/catalog.service.js';
import ObraGrid from '../../components/obras/ObraGrid.jsx';
import ObraGridSkeleton from '../../components/obras/ObraGridSkeleton.jsx';

// "Voce tambem pode gostar": GET /api/obras/:id/relacionadas (generos em comum e mesmo tipo).
export default function ObrasRelacionadas({ obraId }) {
  const { data, loading, error } = useFetch(() => catalogService.getRelacionadas(obraId, 6), [obraId]);
  if (error || (!loading && !data?.length)) return null;
  return (
    <section aria-labelledby="relacionadas-titulo" className="mt-14">
      <h2 id="relacionadas-titulo" className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-100">
        <Sparkles className="size-5 text-accent-400" aria-hidden="true" /> Obras relacionadas
      </h2>
      {loading ? <ObraGridSkeleton count={6} /> : <ObraGrid obras={data} visiveisAte2xl={6} />}
    </section>
  );
}
