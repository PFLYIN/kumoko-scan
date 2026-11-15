import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownUp, BookOpen, Bookmark, ChevronRight, Play, Search } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatData, formatNumeroCapitulo } from '../../utils/format.js';
import ErrorState from '../../components/ui/ErrorState.jsx';

// A busca so aparece em listas longas, onde rolar e cansativo.
const MIN_PARA_BUSCA = 8;

function CapitulosSkeleton() {
  return (
    <div role="status" aria-label="Carregando capítulos" className="grid gap-px overflow-hidden rounded-xl lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse bg-white/5" />
      ))}
    </div>
  );
}

// Lista de capitulos disponiveis para leitura online, com busca, ordem e marcacao do ultimo lido.
export default function CapitulosLista({ obraId, ultimoLidoId }) {
  const { data: capitulos, loading, error, reload } = useFetch(() => catalogService.listCapitulos(obraId), [obraId]);
  const [filtro, setFiltro] = useState('');
  const [decrescente, setDecrescente] = useState(false);

  const termo = filtro.trim().toLowerCase();
  const visiveis = (capitulos ?? [])
    .filter(
      (cap) =>
        !termo ||
        formatNumeroCapitulo(cap.numero).includes(termo) ||
        (cap.titulo ?? '').toLowerCase().includes(termo),
    )
    .sort((a, b) => (decrescente ? b.numero - a.numero : a.numero - b.numero));

  return (
    <section aria-labelledby="capitulos-titulo" className="mt-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="capitulos-titulo" className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <BookOpen className="size-5 text-brand-400" aria-hidden="true" /> Capítulos
          {capitulos?.length > 0 && <span className="text-sm font-normal text-zinc-500">({capitulos.length})</span>}
        </h2>
        {capitulos?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {capitulos.length >= MIN_PARA_BUSCA && (
              <div className="relative">
                <label htmlFor="capitulos-busca" className="sr-only">
                  Buscar capítulo
                </label>
                <input
                  id="capitulos-busca"
                  type="search"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Nº ou título"
                  className="field-input w-44 py-2 pr-9"
                />
                <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
              </div>
            )}
            {capitulos.length > 1 && (
              <button
                type="button"
                className="btn-secondary py-2"
                onClick={() => setDecrescente((d) => !d)}
                aria-label={decrescente ? 'Ordenar do primeiro ao último' : 'Ordenar do último ao primeiro'}
              >
                <ArrowDownUp className="size-4" aria-hidden="true" />
                {decrescente ? 'Mais recentes' : 'Do início'}
              </button>
            )}
            <Link to={`/obras/${obraId}/capitulos/${capitulos[0].id}`} className="btn-primary py-2">
              <Play className="size-4" aria-hidden="true" /> Ler do início
            </Link>
          </div>
        )}
      </div>

      {loading && <CapitulosSkeleton />}
      {!loading && error && <ErrorState error={error} onRetry={reload} title="Não foi possível carregar os capítulos" />}
      {!loading && !error && capitulos?.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
          Nenhum capítulo disponível para leitura online ainda.
        </p>
      )}
      {!loading && !error && capitulos?.length > 0 && visiveis.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500" role="status">
          Nenhum capítulo corresponde a &quot;{filtro.trim()}&quot;.
        </p>
      )}
      {!loading && !error && visiveis.length > 0 && (
        <ul className="grid overflow-hidden rounded-xl border border-white/5 bg-ink-850 lg:grid-cols-2 [&>li]:border-b [&>li]:border-white/5 lg:[&>li:nth-child(odd)]:border-r">
          {visiveis.map((cap) => {
            const ultimo = String(cap.id) === String(ultimoLidoId);
            return (
              <li key={cap.id} className={ultimo ? 'bg-brand-500/10' : undefined}>
                <Link
                  to={`/obras/${obraId}/capitulos/${cap.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-zinc-100">Capítulo {formatNumeroCapitulo(cap.numero)}</span>
                    {cap.titulo && <span className="text-zinc-400"> - {cap.titulo}</span>}
                    <span className="block text-xs text-zinc-500">
                      {cap.totalPaginas} página(s) - {formatData(cap.criadoEm)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {ultimo && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold text-brand-300">
                        <Bookmark className="size-3" aria-hidden="true" /> Último lido
                      </span>
                    )}
                    <ChevronRight className="size-4 text-zinc-500" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
