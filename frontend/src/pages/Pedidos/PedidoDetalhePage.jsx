import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';
import { ordersService } from '../../services/orders.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatPreco } from '../../utils/format.js';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PedidoCard from './PedidoCard.jsx';

// Detalhe de um pedido (GET /api/pedidos/:id; 404 tambem quando o pedido e de outro usuario).
export default function PedidoDetalhePage() {
  const { id } = useParams();
  const { data: pedido, loading, error, reload } = useFetch(() => ordersService.getPedido(id), [id]);
  useDocumentTitle(pedido ? `Pedido #${pedido.id}` : 'Pedido');

  const voltar = (
    <Link to="/pedidos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-brand-300">
      <ArrowLeft className="size-4" aria-hidden="true" /> Meus pedidos
    </Link>
  );

  if (loading) return <LoadingState message="Carregando pedido..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {voltar}
        {error.status === 404 ? (
          <EmptyState icon={Receipt} title="Pedido não encontrado" description="Confira o número do pedido no seu histórico." />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  const totalItens = pedido.itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {voltar}
      <h1 className="mb-1 text-2xl font-semibold text-zinc-50">Pedido #{pedido.id}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {totalItens} {totalItens === 1 ? 'unidade' : 'unidades'} em {pedido.itens.length}{' '}
        {pedido.itens.length === 1 ? 'obra' : 'obras'} - total {formatPreco(pedido.total)}
      </p>
      <PedidoCard pedido={pedido} comLinkDetalhe={false} />
    </div>
  );
}
