import { useEffect, useRef } from 'react';
import Spinner from './Spinner.jsx';

/**
 * Dialogo de confirmacao acessivel (substitui window.confirm).
 * Usa <dialog> nativo: foco preso no modal e Esc para fechar.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
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
        if (!loading) onCancel();
      }}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-white/10 bg-ink-800 p-0 text-zinc-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-zinc-100">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-zinc-400">{description}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner className="size-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
