import { Star } from 'lucide-react';

// Exibe a avaliacao (0 a 5) com estrelas preenchidas ate o valor arredondado.
export default function StarRating({ value = 0, size = 'size-4' }) {
  const nota = Math.max(0, Math.min(5, Number(value) || 0));
  const cheias = Math.round(nota);

  return (
    <span className="inline-flex items-center gap-1" aria-label={`Avaliação ${nota.toFixed(1)} de 5`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= cheias ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400" aria-hidden="true">
        {nota.toFixed(1)}
      </span>
    </span>
  );
}
