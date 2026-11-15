import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookX } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatPreco, tipoLabel } from '../../utils/format.js';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import ObraCover from '../../components/obras/ObraCover.jsx';
import TipoBadge from '../../components/obras/TipoBadge.jsx';
import AdicionarAoCarrinho from './AdicionarAoCarrinho.jsx';
import CapitulosLista from './CapitulosLista.jsx';

export default function ObraDetalhesPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data: obra, loading, error, reload } = useFetch(() => catalogService.getObra(id), [id]);
  useDocumentTitle(obra?.nome ?? 'Obra');

  if (loading) return <LoadingState message="Carregando obra..." />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {error.status === 404 ? (
          <EmptyState
            icon={BookX}
            title="Obra não encontrada"
            description="Ela pode ter sido removida do acervo."
            action={
              <Link to="/catalogo" className="btn-secondary">
                Ver catálogo
              </Link>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-brand-300">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao catálogo
      </Link>

      <article className="grid gap-8 md:grid-cols-[minmax(0,18rem)_1fr] lg:gap-12">
        <ObraCover
          src={obra.capaUrl}
          alt={`Capa de ${obra.nome}`}
          className="mx-auto aspect-[2/3] w-full max-w-72 rounded-2xl shadow-2xl ring-1 shadow-black/50 ring-white/10"
        />

        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <TipoBadge tipo={obra.tipo} />
              {obra.volume && <span className="text-xs text-zinc-400">Volume {obra.volume}</span>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">{obra.nome}</h1>
            <p className="mt-1 text-sm text-zinc-400">{obra.autor || 'Autor desconhecido'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <StarRating value={obra.avaliacao} />
            {obra.totalVendido > 0 && (
              <span className="text-xs text-zinc-500">{obra.totalVendido} vendido(s)</span>
            )}
          </div>

          <p className="text-3xl font-bold text-zinc-50">{formatPreco(obra.preco)}</p>

          <AdicionarAoCarrinho obra={obra} />

          {isAdmin && (
            <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
              <Link to={`/admin/obras/${obra.id}/editar`} className="btn-secondary">
                Editar obra
              </Link>
              <Link to={`/admin/obras/${obra.id}/capitulos`} className="btn-secondary">
                Gerenciar capítulos
              </Link>
            </div>
          )}

          <section aria-labelledby="sinopse">
            <h2 id="sinopse" className="mb-2 text-lg font-semibold text-zinc-100">
              Sinopse
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-400">
              {obra.descricao || `Nenhuma sinopse disponível para este ${tipoLabel(obra.tipo).toLowerCase()} no momento.`}
            </p>
          </section>
        </div>
      </article>

      <CapitulosLista obraId={obra.id} />
    </div>
  );
}
