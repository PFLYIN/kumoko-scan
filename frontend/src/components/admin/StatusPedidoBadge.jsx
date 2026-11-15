const ESTILOS = {
  CONCLUIDO: 'border-emerald-500/40 text-emerald-300',
  CANCELADO: 'border-red-500/40 text-red-300',
};
const ROTULOS = { CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };

export default function StatusPedidoBadge({ status }) {
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase ${ESTILOS[status] ?? 'border-zinc-600 text-zinc-300'}`}>
      {ROTULOS[status] ?? status}
    </span>
  );
}
