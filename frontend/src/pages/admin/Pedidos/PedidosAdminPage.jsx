import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Receipt, X } from 'lucide-react';
import { adminService } from '../../../services/admin.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { formatDataHora, formatPreco, tipoLabel } from '../../../utils/format.js';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import LoadingState from '../../../components/ui/LoadingState.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import ObraCover from '../../../components/obras/ObraCover.jsx';
import StatusPedidoBadge from '../../../components/admin/StatusPedidoBadge.jsx';

const LIMIT = 20;

// Lista paginada + nomes dos clientes da pagina (uma consulta extra ao auth-service).
async function carregar(params) {
  const pedidos = await adminService.listarPedidos(params);
  const ids = [...new Set(pedidos.data.map((p) => p.usuarioId))];
  let clientes = {};
  if (ids.length) {
    try {
      const { data } = await adminService.listarUsuarios({ ids: ids.join(','), limit: 50 });
      clientes = Object.fromEntries(data.map((u) => [u.id, u]));
    } catch {
      // Sem nomes: a lista continua util com o id do cliente.
    }
  }
  return { ...pedidos, clientes };
}

export default function PedidosAdminPage() {
  useDocumentTitle('Pedidos');
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const usuarioId = searchParams.get('usuarioId') ?? '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const [aberto, setAberto] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => carregar({ status, usuarioId, page, limit: LIMIT }),
    [status, usuarioId, page],
  );

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: undefined, ...changes }).forEach(([k, v]) => {
      if (v === undefined || v === '' || (k === 'page' && v === 1)) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const pedidos = data?.data ?? [];
  const clienteFiltro = usuarioId ? data?.clientes?.[usuarioId] : null;

  return (
    <div>
      <PageHeader title="Pedidos" subtitle={data?.meta ? `${data.meta.total} pedido(s) encontrado(s)` : 'Todas as vendas da loja.'} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Status
          <select className="field-input w-auto py-1.5" value={status} onChange={(e) => updateParams({ status: e.target.value })}>
            <option value="" className="bg-ink-800">Todos</option>
            <option value="CONCLUIDO" className="bg-ink-800">Concluídos</option>
            <option value="CANCELADO" className="bg-ink-800">Cancelados</option>
          </select>
        </label>
        {usuarioId && (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-600/20 px-3 py-1 text-sm text-brand-200">
            Cliente: {clienteFiltro ? clienteFiltro.nome : `#${usuarioId}`}
            <button type="button" className="cursor-pointer" aria-label="Remover filtro de cliente" onClick={() => updateParams({ usuarioId: undefined })}>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        )}
      </div>

      {loading && <LoadingState message="Carregando pedidos..." />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && pedidos.length === 0 && (
        <EmptyState icon={Receipt} title="Nenhum pedido encontrado" description="Ajuste os filtros ou aguarde novas vendas." />
      )}
      {!loading && !error && pedidos.length > 0 && (
        <>
          <div className="panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Pedidos</caption>
              <thead className="bg-white/5 text-xs tracking-wide text-zinc-400 uppercase">
                <tr>
                  <th scope="col" className="w-8 px-3 py-2.5"><span className="sr-only">Detalhes</span></th>
                  <th scope="col" className="px-3 py-2.5">Pedido</th>
                  <th scope="col" className="px-3 py-2.5">Data</th>
                  <th scope="col" className="px-3 py-2.5">Cliente</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Itens</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pedidos.map((p) => {
                  const cliente = data.clientes[p.usuarioId];
                  const expandido = aberto === p.id;
                  const unidades = p.itens.reduce((s, i) => s + i.quantidade, 0);
                  return (
                    <Fragment key={p.id}>
                      <tr className="hover:bg-white/[0.03]">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-white/10"
                            aria-expanded={expandido}
                            aria-label={`Detalhes do pedido #${p.id}`}
                            onClick={() => setAberto(expandido ? null : p.id)}
                          >
                            {expandido ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium text-zinc-100">#{p.id}</td>
                        <td className="px-3 py-2 text-zinc-400">{formatDataHora(p.criadoEm)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="cursor-pointer text-left hover:text-brand-300"
                            title="Filtrar pedidos deste cliente"
                            onClick={() => updateParams({ usuarioId: p.usuarioId })}
                          >
                            <span className="block text-zinc-200">{cliente?.nome ?? `Cliente #${p.usuarioId}`}</span>
                            {cliente && <span className="block text-xs text-zinc-500">{cliente.email}</span>}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-400 tabular-nums">{unidades}</td>
                        <td className="px-3 py-2"><StatusPedidoBadge status={p.status} /></td>
                        <td className="px-3 py-2 text-right font-medium text-zinc-100 tabular-nums">{formatPreco(p.total)}</td>
                      </tr>
                      {expandido && (
                        <tr className="bg-black/20">
                          <td />
                          <td colSpan={6} className="px-3 py-3">
                            <ul className="flex flex-col gap-2" aria-label={`Itens do pedido #${p.id}`}>
                              {p.itens.map((item) => (
                                <li key={item.obraId} className="flex items-center gap-3">
                                  <ObraCover src={item.capaUrl} alt="" className="aspect-[2/3] w-7 shrink-0 rounded" />
                                  <Link to={`/admin/obras/${item.obraId}/editar`} className="flex-1 truncate text-zinc-200 hover:text-brand-300">
                                    {item.nome}
                                  </Link>
                                  <span className="text-xs text-zinc-500">{tipoLabel(item.tipo)}</span>
                                  <span className="w-40 text-right text-zinc-400 tabular-nums">
                                    {item.quantidade} × {formatPreco(item.precoUnitario)}
                                  </span>
                                  <span className="w-24 text-right text-zinc-100 tabular-nums">{formatPreco(item.subtotal)}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta?.page ?? page} totalPages={data.meta?.totalPages ?? 1} onChange={(p) => updateParams({ page: p })} />
        </>
      )}
    </div>
  );
}
