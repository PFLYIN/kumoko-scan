import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 1, max = 99, label = 'Quantidade' }) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        className="cursor-pointer rounded-l-xl p-2.5 text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="cursor-pointer rounded-r-xl p-2.5 text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
