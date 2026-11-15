import { ChevronLeft, ChevronRight } from 'lucide-react';

// Paginacao baseada no meta { page, totalPages } do Paginated<T> do backend.
export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-3">
      <button
        type="button"
        className="btn-secondary px-3"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <span className="text-sm text-zinc-400" aria-current="page">
        Página <strong className="text-zinc-100">{page}</strong> de {totalPages}
      </span>
      <button
        type="button"
        className="btn-secondary px-3"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
