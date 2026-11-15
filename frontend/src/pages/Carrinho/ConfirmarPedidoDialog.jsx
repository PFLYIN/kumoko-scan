import { useEffect, useRef } from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import { formatPreco } from '../../utils/format.js';
import Spinner from '../../components/ui/Spinner.jsx';

/**
 * Confirmacao do checkout: resumo dos itens, quantidades e total estimado.
 * <dialog> nativo (foco preso, Esc fecha). O preco final e definido pelo catalogo no servidor.
 */
export default function ConfirmarPedidoDialog({ open, items, totalItens, totalEstimado, enviando, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!enviando) onCancel();
      }}
      aria-labelledby="confirmar-pedido-titulo"
      aria-describedby="confirmar-pedido-aviso"
      className="m-auto w-[min(34rem,calc(100%-2rem))] rounded-2xl border border-white/10 bg-ink-800 p-0 text-zinc-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id="confirmar-pedido-titulo" className="text-lg font-semibold text-zinc-100">
          Confirmar pedido
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {totalItens} {totalItens === 1 ? 'item' : 'itens'} em {items.length} {items.length === 1 ? 'obra' : 'obras'}
        </p>

        <ul aria-label="Itens do pedido" className="mt-4 flex max-h-72 flex-col divide-y divide-white/5 overflow-y-auto">
          {items.map((item) => (
            <li key={item.obraId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-zinc-200">{item.snapshot.nome}</span>
              <span className="shrink-0 text-zinc-400">
                {item.quantidade} x {formatPreco(item.snapshot.preco)}
              </span>
              <span className="w-24 shrink-0 text-right font-medium text-zinc-100">
                {formatPreco(Number(item.snapshot.preco) * item.quantidade)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
          <dt className="text-sm text-zinc-400">Total estimado</dt>
          <dd className="text-2xl font-bold text-zinc-50" data-testid="confirmar-total">
            {formatPreco(totalEstimado)}
          </dd>
        </dl>
        <p id="confirmar-pedido-aviso" className="mt-3 flex gap-2 text-xs text-zinc-500">
          <Info className="size-4 shrink-0" aria-hidden="true" />O preço final é confirmado pelo catálogo no momento
          do pedido e pode diferir do estimado se algum preço tiver mudado.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={enviando}>
            Voltar ao carrinho
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={enviando}>
            {enviando ? <Spinner className="size-4" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
            {enviando ? 'Processando...' : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
