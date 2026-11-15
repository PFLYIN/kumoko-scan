import { Link, useParams } from 'react-router-dom';
import { BookOpen, BookX, PackageCheck } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatNumeroCapitulo, formatPreco, TIPOS_OBRA, tipoLabel, tipoTemCapitulos } from '../../utils/format.js';
import { useProgressoDaObra } from '../../hooks/useLeitura.js';
import GeneroChips from '../../components/obras/GeneroChips.jsx';
import Breadcrumb from './Breadcrumb.jsx';
import Sinopse from './Sinopse.jsx';
import ObrasRelacionadas from './ObrasRelacionadas.jsx';
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
  const progresso = useProgressoDaObra(obra?.id);

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 2xl:max-w-7xl">
      <Breadcrumb
        itens={[
          { label: 'Início', to: '/' },
          { label: 'Catálogo', to: '/catalogo' },
          { label: TIPOS_OBRA.find((t) => t.value === obra.tipo)?.plural ?? tipoLabel(obra.tipo), to: `/catalogo?tipo=${obra.tipo}` },
          { label: obra.nome },
        ]}
      />

      <article className="grid gap-8 md:grid-cols-[minmax(0,18rem)_1fr] lg:gap-12 2xl:grid-cols-[22rem_1fr]">
        <ObraCover
          src={obra.capaMediaUrl ?? obra.capaUrl}
          alt={`Capa de ${obra.nome}`}
          titulo={obra.nome}
          width={720}
          height={1080}
          className="mx-auto aspect-[2/3] w-full max-w-72 rounded-2xl 2xl:max-w-88 shadow-2xl ring-1 shadow-black/50 ring-white/10"
        />

        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <TipoBadge tipo={obra.tipo} />
              {obra.volume && <span className="text-xs text-zinc-400">Volume {obra.volume}</span>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">{obra.nome}</h1>
            <p className="mt-1 text-sm text-zinc-400">{obra.autor || 'Autor desconhecido'}</p>
            <GeneroChips generos={obra.generos} size="sm" className="mt-3" />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <StarRating value={obra.avaliacao} />
            {obra.totalVendido > 0 && (
              <span className="text-xs text-zinc-500">{obra.totalVendido} vendido(s)</span>
            )}
          </div>

          <p className="text-3xl font-bold text-zinc-50">{formatPreco(obra.preco)}</p>

          <AdicionarAoCarrinho obra={obra} />

          {progresso && tipoTemCapitulos(obra.tipo) && (
            <Link
              to={`/obras/${obra.id}/capitulos/${progresso.capituloId}`}
              className="btn-secondary self-start border-brand-400/30 text-brand-300"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Continuar leitura: cap. {formatNumeroCapitulo(progresso.capituloNumero)}
              {progresso.totalPaginas > 0 && `, pág. ${Math.min(progresso.pagina, progresso.totalPaginas)}/${progresso.totalPaginas}`}
            </Link>
          )}

          {isAdmin && (
            <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
              <Link to={`/admin/obras/${obra.id}/editar`} className="btn-secondary">
                Editar obra
              </Link>
              {tipoTemCapitulos(obra.tipo) && (
                <Link to={`/admin/obras/${obra.id}/capitulos`} className="btn-secondary">
                  Gerenciar capítulos
                </Link>
              )}
            </div>
          )}

          <Sinopse
            texto={obra.descricao}
            vazio={`Nenhuma sinopse disponível para este ${tipoLabel(obra.tipo).toLowerCase()} no momento.`}
          />
        </div>
      </article>

      {tipoTemCapitulos(obra.tipo) ? (
        <CapitulosLista obraId={obra.id} ultimoLidoId={progresso?.capituloId} />
      ) : (
        <p className="mt-12 flex items-center gap-3 rounded-xl border border-white/5 bg-ink-850 px-4 py-4 text-sm text-zinc-400">
          <PackageCheck className="size-5 shrink-0 text-emerald-300" aria-hidden="true" />
          Livros são vendidos como edição completa: não há capítulos para leitura online.
        </p>
      )}

      <ObrasRelacionadas obraId={obra.id} />
    </div>
  );
}
