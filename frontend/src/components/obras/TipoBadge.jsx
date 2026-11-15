import { tipoLabel } from '../../utils/format.js';

const CORES = {
  manga: 'bg-brand-500/15 text-brand-300 ring-brand-400/30',
  livro: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  novel: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30',
};

export default function TipoBadge({ tipo, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ring-1 ${CORES[tipo] ?? 'bg-white/10 text-zinc-300 ring-white/10'} ${className}`}
    >
      {tipoLabel(tipo)}
    </span>
  );
}
