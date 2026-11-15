import { Link } from 'react-router-dom';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { formatPreco, tipoTemCapitulos } from '../../../utils/format.js';
import ObraCover from '../../../components/obras/ObraCover.jsx';
import TipoBadge from '../../../components/obras/TipoBadge.jsx';

// Tabela no desktop; em telas pequenas cada linha vira um cartao empilhado.
// Cabecalho clicavel que alterna a ordenacao do servidor (aria-sort para leitores de tela).
function Ordenavel({ label, asc, desc, ordenar, onOrdenar, className = '' }) {
  const ativo = ordenar === asc ? 'ascending' : ordenar === desc ? 'descending' : 'none';
  const proximo = ordenar === desc && asc ? asc : desc ?? asc;
  return (
    <th scope="col" aria-sort={ativo} className={'px-4 py-2.5 ' + className}>
      <button type="button" className="cursor-pointer uppercase hover:text-zinc-100" onClick={() => onOrdenar(proximo)}>
        {label}
        <span aria-hidden="true" className="ml-1 text-brand-300">{ativo === 'ascending' ? '▲' : ativo === 'descending' ? '▼' : ''}</span>
      </button>
    </th>
  );
}

export default function AcervoTabela({ obras, onExcluir, ordenar, onOrdenar }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Obras do acervo</caption>
        <thead className="hidden bg-white/5 text-xs tracking-wide text-zinc-400 uppercase md:table-header-group">
          <tr>
            <Ordenavel label="Obra" asc="nome" ordenar={ordenar} onOrdenar={onOrdenar} />
            <th scope="col" className="px-4 py-2.5">
              Tipo
            </th>
            <Ordenavel label="Preço" asc="preco-asc" desc="preco-desc" ordenar={ordenar} onOrdenar={onOrdenar} className="text-right" />
            <Ordenavel label="Vendidos" desc="mais-vendidos" ordenar={ordenar} onOrdenar={onOrdenar} className="text-right" />
            <th scope="col" className="px-4 py-2.5 text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {obras.map((obra) => (
            <tr key={obra.id} className="flex flex-wrap items-center gap-3 p-4 md:table-row md:p-0">
              <td className="flex min-w-0 flex-1 items-center gap-3 md:px-4 md:py-2">
                <ObraCover src={obra.capaThumbUrl ?? obra.capaUrl} alt={`Capa de ${obra.nome}`} className="aspect-[2/3] w-8 shrink-0 rounded" />
                <div className="min-w-0">
                  <Link to={`/obras/${obra.id}`} className="block truncate font-medium text-zinc-100 hover:text-brand-300">
                    {obra.nome}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">
                    {obra.autor || 'Autor desconhecido'}
                    {obra.volume ? ` - Vol. ${obra.volume}` : ''}
                  </p>
                </div>
              </td>
              <td className="md:px-4 md:py-2">
                <TipoBadge tipo={obra.tipo} />
              </td>
              <td className="text-zinc-200 md:px-4 md:py-2 md:text-right">{formatPreco(obra.preco)}</td>
              <td className="hidden text-zinc-400 md:table-cell md:px-4 md:py-2 md:text-right">{obra.totalVendido}</td>
              <td className="w-full md:w-auto md:px-4 md:py-2">
                <div className="flex justify-end gap-1">
                  {tipoTemCapitulos(obra.tipo) ? (
                  <Link
                    to={`/admin/obras/${obra.id}/capitulos`}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-brand-300"
                    aria-label={`Capítulos de ${obra.nome}`}
                    title="Capítulos"
                  >
                    <BookOpen className="size-4" aria-hidden="true" />
                  </Link>
                  ) : (
                    <span className="size-8" aria-hidden="true" />
                  )}
                  <Link
                    to={`/admin/obras/${obra.id}/editar`}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-brand-300"
                    aria-label={`Editar ${obra.nome}`}
                    title="Editar"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onExcluir(obra)}
                    className="cursor-pointer rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                    aria-label={`Excluir ${obra.nome}`}
                    title="Excluir"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
