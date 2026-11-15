import { Link } from 'react-router-dom';
import { BookCopy, DollarSign, Plus, Receipt, ShoppingBag, Users } from 'lucide-react';
import { adminService } from '../../../services/admin.service.js';
import { catalogService } from '../../../services/catalog.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { formatDataHora, formatPreco, tipoLabel } from '../../../utils/format.js';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import LoadingState from '../../../components/ui/LoadingState.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import ObraCover from '../../../components/obras/ObraCover.jsx';
import KpiCard from '../../../components/admin/KpiCard.jsx';
import VendasChart from '../../../components/admin/VendasChart.jsx';
import StatusPedidoBadge from '../../../components/admin/StatusPedidoBadge.jsx';

const DIAS = 30;

async function carregar() {
  const [vendas, usuarios, obras] = await Promise.all([
    adminService.resumoVendas(DIAS),
    adminService.resumoUsuarios(),
    catalogService.listObras({ limit: 1 }),
  ]);
  const ids = [...new Set(vendas.pedidosRecentes.map((p) => p.usuarioId))];
  const clientes = ids.length
    ? await adminService.listarUsuarios({ ids: ids.join(','), limit: 50 }).then((r) => Object.fromEntries(r.data.map((u) => [u.id, u])), () => ({}))
    : {};
  return { vendas, usuarios, clientes, totalObras: obras?.meta?.total ?? 0 };
}

export default function PainelPage() {
  useDocumentTitle('Painel administrativo');
  const { data, loading, error, reload } = useFetch(carregar, []);

  return (
    <div>
      <PageHeader
        title="Painel"
        subtitle="Visão geral de vendas, clientes e acervo."
        actions={
          <Link to="/admin/obras/nova" className="btn-primary">
            <Plus className="size-4" aria-hidden="true" /> Nova obra
          </Link>
        }
      />
      {loading && <LoadingState message="Carregando indicadores..." />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data && <Conteudo {...data} />}
    </div>
  );
}

function Conteudo({ vendas, usuarios, clientes, totalObras }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard icon={DollarSign} label="Receita total" value={formatPreco(vendas.receitaTotal)} detail={`${formatPreco(vendas.receitaPeriodo)} nos últimos ${vendas.dias} dias`} />
        <KpiCard icon={Receipt} label="Pedidos" value={vendas.totalPedidos} detail={`${vendas.pedidosPeriodo} nos últimos ${vendas.dias} dias`} />
        <KpiCard icon={ShoppingBag} label="Ticket médio" value={formatPreco(vendas.ticketMedio)} detail={`${vendas.itensVendidos} unidade(s) vendida(s)`} />
        <KpiCard icon={Users} label="Clientes" value={usuarios.clientes} detail={`${usuarios.compradores} compradores · ${usuarios.novosUltimos30Dias} novos em 30 dias`} />
        <KpiCard icon={BookCopy} label="Obras" value={totalObras} detail="no catálogo" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="panel p-5" aria-labelledby="titulo-vendas">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="titulo-vendas" className="font-semibold text-zinc-100">
              Receita por dia
            </h2>
            <span className="text-xs text-zinc-500">últimos {vendas.dias} dias</span>
          </div>
          {vendas.pedidosPeriodo === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">Nenhuma venda no período.</p>
          ) : (
            <VendasChart dados={vendas.vendasPorDia} />
          )}
        </section>

        <section className="panel p-5" aria-labelledby="titulo-top">
          <h2 id="titulo-top" className="mb-3 font-semibold text-zinc-100">
            Mais vendidas ({vendas.dias} dias)
          </h2>
          {vendas.topObras.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sem vendas no período.</p>
          ) : (
            <ol className="flex flex-col gap-3" aria-label="Obras mais vendidas">
              {vendas.topObras.map((o, i) => (
                <li key={o.obraId} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-zinc-500 tabular-nums">{i + 1}</span>
                  <ObraCover src={o.capaUrl} alt="" className="aspect-[2/3] w-8 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/obras/${o.obraId}/editar`} className="block truncate text-sm text-zinc-100 hover:text-brand-300">
                      {o.nome}
                    </Link>
                    <p className="text-xs text-zinc-500">{tipoLabel(o.tipo)}</p>
                  </div>
                  <div className="text-right text-xs tabular-nums">
                    <p className="text-zinc-200">{o.quantidade} un.</p>
                    <p className="text-zinc-500">{formatPreco(o.receita)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="panel overflow-hidden" aria-labelledby="titulo-recentes">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 id="titulo-recentes" className="font-semibold text-zinc-100">
            Pedidos recentes
          </h2>
          <Link to="/admin/pedidos" className="text-sm text-brand-300 hover:underline">
            Ver todos
          </Link>
        </div>
        {vendas.pedidosRecentes.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-zinc-500">Nenhum pedido ainda.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="px-5 py-2">Pedido</th>
                <th className="px-5 py-2">Data</th>
                <th className="px-5 py-2">Cliente</th>
                <th className="px-5 py-2">Itens</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vendas.pedidosRecentes.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2 text-zinc-200">#{p.id}</td>
                  <td className="px-5 py-2 text-zinc-400">{formatDataHora(p.criadoEm)}</td>
                  <td className="px-5 py-2">
                    <Link to={`/admin/pedidos?usuarioId=${p.usuarioId}`} className="text-zinc-300 hover:text-brand-300">
                      {clientes[p.usuarioId]?.nome ?? `Cliente #${p.usuarioId}`}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-5 py-2 text-zinc-400">{p.itens.map((i) => i.nome).join(', ')}</td>
                  <td className="px-5 py-2">
                    <StatusPedidoBadge status={p.status} />
                  </td>
                  <td className="px-5 py-2 text-right text-zinc-100 tabular-nums">{formatPreco(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
