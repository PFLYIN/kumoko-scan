import { Link, useSearchParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { ordersService } from '../../services/orders.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import PedidoCard from './PedidoCard.jsx';

const LIMIT = 10;

export default function PedidosPage() {
  useDocumentTitle('Meus pedidos');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const novoId = Number(searchParams.get('novo')) || null;

  const { data, loading, error, reload } = useFetch(() => ordersService.listPedidos({ page, limit: LIMIT }), [page]);
  const pedidos = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader title="Meus pedidos" subtitle="Histórico das suas aquisições no Kumoko Scan." />

      {loading && <LoadingState message="Carregando pedidos..." />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && pedidos.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="Você ainda não fez pedidos"
          description="Quando finalizar uma compra, ela aparecerá aqui."
          action={
            <Link to="/catalogo" className="btn-primary">
              Explorar catálogo
            </Link>
          }
        />
      )}
      {!loading && !error && pedidos.length > 0 && (
        <>
          <ul className="flex flex-col gap-4">
            {pedidos.map((pedido) => (
              <li key={pedido.id}>
                <PedidoCard pedido={pedido} destaque={pedido.id === novoId} />
              </li>
            ))}
          </ul>
          <Pagination
            page={data.meta?.page ?? page}
            totalPages={data.meta?.totalPages ?? 1}
            onChange={(p) => setSearchParams(p > 1 ? { page: String(p) } : {})}
          />
        </>
      )}
    </div>
  );
}
