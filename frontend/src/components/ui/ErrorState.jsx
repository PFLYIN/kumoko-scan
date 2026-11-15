import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorState({ error, title = 'Não foi possível carregar', onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center"
    >
      <AlertTriangle className="size-10 text-red-400" aria-hidden="true" />
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      <p className="max-w-md text-sm text-zinc-400">{error?.message ?? 'Erro inesperado.'}</p>
      {error?.requestId && <p className="text-xs text-zinc-600">Código de suporte: {error.requestId}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-2">
          <RotateCcw className="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
