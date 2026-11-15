import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudOff, ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { catalogService } from '../../services/catalog.service.js';
import { ordersService } from '../../services/orders.service.js';
import { generateUuid } from '../../utils/uuid.js';
import { formatPreco } from '../../utils/format.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import CarrinhoItem from './CarrinhoItem.jsx';
import CarrinhoResumo from './CarrinhoResumo.jsx';

export default function CarrinhoPage() {
  useDocumentTitle('Carrinho');
  const { items, totalItens, totalEstimado, setQuantidade, removeItem, clear, refreshSnapshots } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [enviando, setEnviando] = useState(false);
  const [catalogoIndisponivel, setCatalogoIndisponivel] = useState(false);
  // Mesma chave enquanto o conteudo do carrinho nao muda: um retry apos falha de rede
  // nao gera pedido duplicado (o backend devolve o pedido ja criado).
  const [idempotency, setIdempotency] = useState({ assinatura: null, chave: null });

  const ids = items.map((i) => i.obraId);
  const idsKey = ids.join(',');
  const assinatura = items.map((i) => `${i.obraId}x${i.quantidade}`).join('|');

  // Atualiza nome/preco/capa exibidos com os dados atuais do catalogo (falha silenciosa: mantem o snapshot).
  useEffect(() => {
    if (!idsKey) return undefined;
    let active = true;
    catalogService
      .getObrasLote(idsKey.split(',').map(Number))
      .then((obras) => active && refreshSnapshots(obras))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [idsKey, refreshSnapshots]);

  const indisponiveis = items.filter((i) => i.snapshot.indisponivel);

  const finalizar = async () => {
    if (indisponiveis.length) {
      toast.error('Remova as obras indisponíveis antes de finalizar.');
      return;
    }
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para finalizar a compra.');
      navigate('/entrar?redirect=/carrinho');
      return;
    }

    const chave = idempotency.assinatura === assinatura && idempotency.chave ? idempotency.chave : generateUuid();
    setIdempotency({ assinatura, chave });
    setEnviando(true);
    setCatalogoIndisponivel(false);

    try {
      const pedido = await ordersService.createPedido(items, chave);
      clear();
      setIdempotency({ assinatura: null, chave: null });
      toast.success(`Pedido #${pedido.id} concluído! Total: ${formatPreco(pedido.total)}`);
      navigate(`/pedidos?novo=${pedido.id}`);
    } catch (err) {
      if (err.status === 503) {
        setCatalogoIndisponivel(true);
      } else if (err.status === 401) {
        navigate('/entrar?redirect=/carrinho');
      }
      toast.error(err);
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <PageHeader title="Meu carrinho" />
        <EmptyState
          icon={ShoppingCart}
          title="Seu carrinho está vazio"
          description="Explore o catálogo e adicione suas obras favoritas."
          action={
            <Link to="/catalogo" className="btn-primary">
              Ver catálogo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="Meu carrinho" subtitle={`${totalItens} ${totalItens === 1 ? 'item' : 'itens'} no carrinho`} />

      {indisponiveis.length > 0 && (
        <div role="alert" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {indisponiveis.length === 1 ? 'Uma obra do carrinho não está' : `${indisponiveis.length} obras do carrinho não estão`} mais
          no catálogo. Remova para finalizar o pedido.
        </div>
      )}

      {catalogoIndisponivel && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
        >
          <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            O catálogo está temporariamente indisponível e não conseguimos confirmar os preços. Seu carrinho foi
            mantido; tente finalizar novamente em alguns instantes.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="flex flex-col gap-4" aria-label="Itens do carrinho">
          {items.map((item) => (
            <CarrinhoItem
              key={item.obraId}
              item={item}
              onQuantidade={(q) => setQuantidade(item.obraId, q)}
              onRemover={() => removeItem(item.obraId)}
              disabled={enviando}
            />
          ))}
        </ul>

        <CarrinhoResumo
          totalEstimado={totalEstimado}
          enviando={enviando}
          podeFinalizar={!authLoading && indisponiveis.length === 0}
          isAuthenticated={isAuthenticated}
          onFinalizar={finalizar}
        />
      </div>
    </div>
  );
}
