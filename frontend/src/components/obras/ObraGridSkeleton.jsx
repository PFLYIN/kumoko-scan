import { OBRA_GRID_CLASSES } from './ObraGrid.jsx';

// Esqueleto exibido enquanto o catalogo carrega.
export default function ObraGridSkeleton({ count = 12 }) {
  return (
    <div className={OBRA_GRID_CLASSES} role="status" aria-label="Carregando obras">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex animate-pulse flex-col gap-3">
          <div className="aspect-[2/3] rounded-xl bg-white/5" />
          <div className="h-3 w-3/4 rounded bg-white/5" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
