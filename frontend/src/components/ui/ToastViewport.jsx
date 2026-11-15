import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ESTILOS = {
  success: { icon: CheckCircle2, classes: 'border-emerald-500/30 text-emerald-200', iconClass: 'text-emerald-400' },
  error: { icon: XCircle, classes: 'border-red-500/30 text-red-200', iconClass: 'text-red-400' },
  info: { icon: Info, classes: 'border-brand-400/30 text-brand-300', iconClass: 'text-brand-400' },
};

export default function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map(({ id, type, message }) => {
        const { icon: Icon, classes, iconClass } = ESTILOS[type] ?? ESTILOS.info;
        return (
          <div
            key={id}
            role={type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-ink-800/95 px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur ${classes}`}
          >
            <Icon className={`mt-0.5 size-5 shrink-0 ${iconClass}`} aria-hidden="true" />
            <p className="flex-1 leading-snug">{message}</p>
            <button
              type="button"
              onClick={() => onDismiss(id)}
              className="rounded-md p-0.5 text-zinc-400 hover:text-zinc-100"
              aria-label="Fechar notificação"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
