import { Info, LogIn, ShieldCheck } from 'lucide-react';
import { formatPreco } from '../../utils/format.js';
import Spinner from '../../components/ui/Spinner.jsx';

export default function CarrinhoResumo({ totalEstimado, enviando, podeFinalizar, isAuthenticated, onFinalizar }) {
  return (
    <aside aria-label="Resumo do pedido" className="panel h-fit p-5 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-zinc-100">Resumo</h2>

      <dl className="mt-4 flex items-baseline justify-between border-t border-white/5 pt-4">
        <dt className="text-sm text-zinc-400">Total estimado</dt>
        <dd className="text-2xl font-bold text-zinc-50">{formatPreco(totalEstimado)}</dd>
      </dl>

      <p className="mt-3 flex gap-2 text-xs text-zinc-500">
        <Info className="size-4 shrink-0" aria-hidden="true" />O valor final é confirmado pelo catálogo no momento da
        finalização.
      </p>

      <button
        type="button"
        className="btn-primary mt-5 w-full py-3"
        onClick={onFinalizar}
        disabled={enviando || !podeFinalizar}
      >
        {enviando ? (
          <>
            <Spinner className="size-4" /> Processando...
          </>
        ) : isAuthenticated ? (
          <>
            <ShieldCheck className="size-4" aria-hidden="true" /> Finalizar compra
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden="true" /> Entrar para finalizar
          </>
        )}
      </button>
    </aside>
  );
}
