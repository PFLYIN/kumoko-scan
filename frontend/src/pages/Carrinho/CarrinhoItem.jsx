import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { formatPreco } from '../../utils/format.js';
import ObraCover from '../../components/obras/ObraCover.jsx';
import TipoBadge from '../../components/obras/TipoBadge.jsx';
import QuantityStepper from '../../components/ui/QuantityStepper.jsx';

export default function CarrinhoItem({ item, onQuantidade, onRemover, disabled }) {
  const { obraId, quantidade, snapshot } = item;

  return (
    <li className="panel flex gap-4 p-3 sm:p-4">
      <Link to={`/obras/${obraId}`} className="shrink-0 rounded-lg">
        <ObraCover src={snapshot.capaUrl} alt={`Capa de ${snapshot.nome}`} className="aspect-[2/3] w-20 rounded-lg sm:w-24" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {snapshot.tipo && <TipoBadge tipo={snapshot.tipo} className="mb-1" />}
            <Link to={`/obras/${obraId}`} className="block truncate font-medium text-zinc-100 hover:text-brand-300">
              {snapshot.nome}
            </Link>
            <p className="text-sm text-zinc-400">{formatPreco(snapshot.preco)} cada</p>
          </div>
          <button
            type="button"
            onClick={onRemover}
            disabled={disabled}
            className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            aria-label={`Remover ${snapshot.nome} do carrinho`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper value={quantidade} onChange={onQuantidade} label={`Quantidade de ${snapshot.nome}`} />
          <p className="text-sm font-semibold text-zinc-100">{formatPreco(snapshot.preco * quantidade)}</p>
        </div>
      </div>
    </li>
  );
}
