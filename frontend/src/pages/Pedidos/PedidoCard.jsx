import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatDataHora, formatPreco } from '../../utils/format.js';
import ObraCover from '../../components/obras/ObraCover.jsx';
import TipoBadge from '../../components/obras/TipoBadge.jsx';

const STATUS = {
  CONCLUIDO: { label: 'Concluído', icon: CheckCircle2, classes: 'bg-emerald-500/15 text-emerald-300' },
  CANCELADO: { label: 'Cancelado', icon: XCircle, classes: 'bg-red-500/15 text-red-300' },
};

export default function PedidoCard({ pedido, destaque = false }) {
  const status = STATUS[pedido.status] ?? { label: pedido.status, icon: CheckCircle2, classes: 'bg-white/10 text-zinc-300' };
  const StatusIcon = status.icon;

  return (
    <article
      aria-labelledby={`pedido-${pedido.id}`}
      className={`panel p-4 sm:p-5 ${destaque ? 'border-brand-400/50 ring-1 ring-brand-400/40' : ''}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 id={`pedido-${pedido.id}`} className="font-semibold text-zinc-100">
            Pedido #{pedido.id}
            {destaque && <span className="ml-2 text-xs font-normal text-brand-300">(recém-criado)</span>}
          </h2>
          <p className="text-xs text-zinc-500">{formatDataHora(pedido.criadoEm)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.classes}`}>
            <StatusIcon className="size-3.5" aria-hidden="true" />
            {status.label}
          </span>
          <span className="text-lg font-bold text-zinc-50">{formatPreco(pedido.total)}</span>
        </div>
      </header>

      <ul className="mt-3 flex flex-col gap-3">
        {pedido.itens.map((item) => (
          <li key={item.obraId} className="flex items-center gap-3">
            <ObraCover src={item.capaUrl} alt={`Capa de ${item.nome}`} className="aspect-[2/3] w-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <Link to={`/obras/${item.obraId}`} className="block truncate text-sm font-medium text-zinc-200 hover:text-brand-300">
                {item.nome}
              </Link>
              <p className="flex items-center gap-2 text-xs text-zinc-500">
                {item.tipo && <TipoBadge tipo={item.tipo} />}
                {item.quantidade} x {formatPreco(item.precoUnitario)}
              </p>
            </div>
            <span className="text-sm font-semibold text-zinc-200">{formatPreco(item.subtotal)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
