import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LibraryBig, Plus } from 'lucide-react';
import { catalogService } from '../../../services/catalog.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../hooks/useToast.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { TIPOS_OBRA } from '../../../utils/format.js';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import LoadingState from '../../../components/ui/LoadingState.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import TipoTabs from '../../../components/obras/TipoTabs.jsx';
import ObraFiltros from '../../../components/obras/ObraFiltros.jsx';
import AcervoTabela from './AcervoTabela.jsx';

const LIMIT = 20;

export default function AcervoPage() {
  useDocumentTitle('Gerenciar acervo');
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tipoParam = searchParams.get('tipo') ?? '';
  const tipo = TIPOS_OBRA.some((t) => t.value === tipoParam) ? tipoParam : '';
  const busca = (searchParams.get('busca') ?? '').trim();
  const ordenar = searchParams.get('ordenar') ?? 'recentes';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const { data, loading, error, reload } = useFetch(
    () => catalogService.listObras({ tipo, busca, ordenar, page, limit: LIMIT }),
    [tipo, busca, ordenar, page],
  );

  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: undefined, ...changes }).forEach(([k, v]) => {
      if (v === undefined || v === '' || (k === 'page' && v === 1)) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const confirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await catalogService.deleteObra(paraExcluir.id);
      toast.success(`"${paraExcluir.nome}" foi removida do acervo.`);
      setParaExcluir(null);
      reload();
    } catch (err) {
      toast.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const obras = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Gerenciar acervo"
        subtitle={data?.meta ? `${data.meta.total} obra(s) cadastrada(s)` : 'Obras, capas e capítulos do catálogo.'}
        actions={
          <Link to="/admin/obras/nova" className="btn-primary">
            <Plus className="size-4" aria-hidden="true" /> Nova obra
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <TipoTabs value={tipo} onChange={(t) => updateParams({ tipo: t })} />
        <ObraFiltros
          key={busca}
          busca={busca}
          ordenar={ordenar}
          onBusca={(b) => updateParams({ busca: b })}
          onOrdenar={(o) => updateParams({ ordenar: o === 'recentes' ? undefined : o })}
        />
      </div>

      {loading && <LoadingState message="Carregando acervo..." />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && obras.length === 0 && (
        <EmptyState
          icon={LibraryBig}
          title="Nenhuma obra encontrada"
          description="Cadastre a primeira obra ou ajuste os filtros."
          action={
            <Link to="/admin/obras/nova" className="btn-primary">
              <Plus className="size-4" aria-hidden="true" /> Nova obra
            </Link>
          }
        />
      )}
      {!loading && !error && obras.length > 0 && (
        <>
          <AcervoTabela obras={obras} onExcluir={setParaExcluir} />
          <Pagination
            page={data.meta?.page ?? page}
            totalPages={data.meta?.totalPages ?? 1}
            onChange={(p) => updateParams({ page: p })}
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(paraExcluir)}
        title="Excluir obra?"
        description={
          paraExcluir
            ? `"${paraExcluir.nome}" será removida permanentemente, junto com a capa, capítulos e páginas.`
            : ''
        }
        confirmLabel="Excluir"
        danger
        loading={excluindo}
        onConfirm={confirmarExclusao}
        onCancel={() => setParaExcluir(null)}
      />
    </div>
  );
}
