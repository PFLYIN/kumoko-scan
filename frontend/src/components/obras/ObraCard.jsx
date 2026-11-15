import { Link } from 'react-router-dom';
import { formatPreco } from '../../utils/format.js';
import ObraCover from './ObraCover.jsx';
import TipoBadge from './TipoBadge.jsx';

export default function ObraCard({ obra }) {
  return (
    <Link
      to={`/obras/${obra.id}`}
      className="group flex flex-col gap-3 rounded-xl focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg ring-1 shadow-black/30 ring-white/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-brand-400/40">
        <ObraCover
          src={obra.capaThumbUrl ?? obra.capaUrl}
          alt={`Capa de ${obra.nome}`}
          className="size-full transition-transform duration-500 group-hover:scale-105"
        />
        <TipoBadge tipo={obra.tipo} className="absolute top-2 left-2 backdrop-blur-md" />
        <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-zinc-100 backdrop-blur-md">
          {formatPreco(obra.preco)}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-zinc-100 group-hover:text-brand-300">{obra.nome}</h3>
        <p className="truncate text-xs text-zinc-500">
          {obra.autor || 'Autor desconhecido'}
          {obra.volume ? ` - Vol. ${obra.volume}` : ''}
        </p>
      </div>
    </Link>
  );
}
