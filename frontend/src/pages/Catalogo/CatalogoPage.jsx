import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { ORDENACOES, TIPOS_OBRA } from '../../utils/format.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import TipoTabs from '../../components/obras/TipoTabs.jsx';
import ObraGrid from '../../components/obras/ObraGrid.jsx';
import ObraGridSkeleton from '../../components/obras/ObraGridSkeleton.jsx';
import ObraFiltros from '../../components/obras/ObraFiltros.jsx';

const LIMIT = 18;

// Le os filtros da URL (fonte da verdade), descartando valores invalidos.
function readFiltros(searchParams) {
  const tipo = searchParams.get('tipo') ?? '';
  const ordenar = searchParams.get('ordenar') ?? 'recentes';
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
  return {
    tipo: TIPOS_OBRA.some((t) => t.value === tipo) ? tipo : '',
    busca: (searchParams.get('busca') ?? '').trim(),
    ordenar: ORDENACOES.some((o) => o.value === ordenar) ? ordenar : 'recentes',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = readFiltros(searchParams);
  const tituloTipo = TIPOS_OBRA.find((t) => t.value === filtros.tipo)?.plural;
  useDocumentTitle(tituloTipo ?? 'Catálogo');

  const { data, loading, error, reload } = useFetch(
    () => catalogService.listObras({ ...filtros, limit: LIMIT }),
    [filtros.tipo, filtros.busca, filtros.ordenar, filtros.page],
  );

  // Atualiza a URL; qualquer filtro novo volta para a pagina 1.
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: undefined, ...changes }).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null || (k === 'page' && v === 1)) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const obras = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title={tituloTipo ?? 'Catálogo'}
        subtitle={
          filtros.busca
            ? `Resultados para "${filtros.busca}"${meta ? ` - ${meta.total} encontrada(s)` : ''}`
            : 'Explore mangás, livros e light novels do acervo.'
        }
      />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <TipoTabs value={filtros.tipo} onChange={(tipo) => updateParams({ tipo })} />
        <ObraFiltros
          key={filtros.busca}
          busca={filtros.busca}
          ordenar={filtros.ordenar}
          onBusca={(busca) => updateParams({ busca })}
          onOrdenar={(ordenar) => updateParams({ ordenar: ordenar === 'recentes' ? undefined : ordenar })}
        />
      </div>

      {loading && <ObraGridSkeleton count={LIMIT} />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && obras.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Nenhuma obra encontrada"
          description="Tente outro termo de busca ou remova os filtros."
          action={
            (filtros.busca || filtros.tipo) && (
              <button type="button" className="btn-secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                Limpar filtros
              </button>
            )
          }
        />
      )}
      {!loading && !error && obras.length > 0 && (
        <>
          <ObraGrid obras={obras} />
          <Pagination
            page={meta?.page ?? filtros.page}
            totalPages={meta?.totalPages ?? 1}
            onChange={(page) => {
              updateParams({ page });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
