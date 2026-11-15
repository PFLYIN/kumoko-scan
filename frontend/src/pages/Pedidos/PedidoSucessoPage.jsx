import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Receipt, ShoppingBag } from 'lucide-react';
import { ordersService } from '../../services/orders.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatPreco } from '../../utils/format.js';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ObraCover from '../../components/obras/ObraCover.jsx';

// Tela exibida apos o checkout (GET /api/pedidos/:id; 404 tambem para pedido de outro usuario).
export default function PedidoSucessoPage() {
  const { id } = useParams();
  const { data: pedido, loading, error, reload } = useFetch(() => ordersService.getPedido(id), [id]);
  useDocumentTitle(pedido ? `Pedido #${pedido.id} confirmado` : 'Pedido confirmado');

  if (loading) return <LoadingState message="Carregando pedido..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {error.status === 404 ? (
          <EmptyState
            icon={Receipt}
            title="Pedido não encontrado"
            description="Confira o número do pedido no seu histórico."
            action={
              <Link to="/pedidos" className="btn-primary">
                Ver meus pedidos
              </Link>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  const totalItens = pedido.itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section aria-labelledby="pedido-sucesso-titulo" className="panel p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="size-14 text-emerald-400" aria-hidden="true" />
          <h1 id="pedido-sucesso-titulo" className="mt-4 text-2xl font-semibold text-zinc-50">
            Pedido #{pedido.id} confirmado!
          </h1>
          <p className="mt-2 text-sm text-zinc-400" role="status">
            Obrigado pela compra. {totalItens} {totalItens === 1 ? 'unidade' : 'unidades'} em {pedido.itens.length}{' '}
            {pedido.itens.length === 1 ? 'obra' : 'obras'}.
          </p>
        </div>

        <ul aria-label="Itens do pedido" className="mt-8 flex flex-col divide-y divide-white/5">
          {pedido.itens.map((item) => (
            <li key={item.obraId} className="flex items-center gap-3 py-3">
              <ObraCover src={item.capaUrl} alt={`Capa de ${item.nome}`} className="aspect-[2/3] w-10 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <Link to={`/obras/${item.obraId}`} className="block truncate text-sm font-medium text-zinc-200 hover:text-brand-300">
                  {item.nome}
                </Link>
                <p className="text-xs text-zinc-500">
                  {item.quantidade} x {formatPreco(item.precoUnitario)}
                </p>
              </div>
              <span className="text-sm font-semibold text-zinc-200">{formatPreco(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
          <dt className="text-sm text-zinc-400">Total pago</dt>
          <dd className="text-2xl font-bold text-zinc-50" data-testid="pedido-total">
            {formatPreco(pedido.total)}
          </dd>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/pedidos?novo=${pedido.id}`} className="btn-primary">
            <Receipt className="size-4" aria-hidden="true" /> Ver meus pedidos
          </Link>
          <Link to="/catalogo" className="btn-secondary">
            <ShoppingBag className="size-4" aria-hidden="true" /> Continuar comprando
          </Link>
        </div>
      </section>
    </div>
  );
}
