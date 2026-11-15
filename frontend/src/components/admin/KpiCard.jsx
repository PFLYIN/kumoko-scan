// Indicador do painel: rotulo, valor principal e detalhe opcional.
export default function KpiCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="panel flex flex-col gap-1 p-4" role="group" aria-label={label}>
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {label}
        {Icon && <Icon className="size-4 text-brand-400" aria-hidden="true" />}
      </div>
      <p className="text-2xl font-semibold text-zinc-50 tabular-nums" data-testid="kpi-valor">
        {value}
      </p>
      {detail && <p className="text-xs text-zinc-500">{detail}</p>}
    </div>
  );
}
