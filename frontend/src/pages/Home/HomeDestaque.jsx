import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play, Star } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { catalogService } from '../../services/catalog.service.js';
import { formatPreco, tipoLabel } from '../../utils/format.js';
import ObraCover from '../../components/obras/ObraCover.jsx';

const INTERVALO_MS = 6000;
const TOTAL = 5;

// Destaque rotativo do hero: obras mais vendidas que tem capa.
export default function HomeDestaque() {
  const { data, loading } = useFetch(() => catalogService.listObras({ ordenar: 'mais-vendidos', limit: 12 }), []);
  const obras = (data?.data ?? []).filter((o) => o.capaMediaUrl || o.capaUrl).slice(0, TOTAL);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [hover, setHover] = useState(false);
  const reduzMovimento =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const total = obras.length;
  const parado = pausado || hover || reduzMovimento || total < 2;
  useEffect(() => {
    if (parado) return undefined;
    const timer = window.setInterval(() => setIndice((i) => (i + 1) % total), INTERVALO_MS);
    return () => window.clearInterval(timer);
  }, [parado, total]);

  if (loading) {
    return <div className="aspect-[4/3] w-full max-w-xl animate-pulse rounded-3xl bg-white/5" aria-hidden="true" />;
  }
  if (total === 0) return null;

  const atual = obras[indice % total];
  const ir = (delta) => setIndice((i) => (i + delta + total) % total);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques do acervo"
      className="relative w-full max-w-xl"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div
        key={atual.id}
        role="group"
        aria-roledescription="slide"
        aria-label={`${(indice % total) + 1} de ${total}: ${atual.nome}`}
        className="panel animate-[fadein_.5s_ease] grid grid-cols-[9rem_1fr] gap-5 overflow-hidden bg-ink-850/80 p-5 backdrop-blur-md sm:grid-cols-[11rem_1fr]"
      >
        <Link to={`/obras/${atual.id}`} tabIndex={-1} aria-hidden="true">
          <ObraCover
            src={atual.capaMediaUrl ?? atual.capaUrl}
            alt=""
            titulo={atual.nome}
            width={720}
            height={1080}
            className="aspect-[2/3] w-full rounded-xl shadow-xl ring-1 shadow-black/50 ring-white/10"
          />
        </Link>
        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-semibold tracking-widest text-brand-300 uppercase">
            Em destaque - {tipoLabel(atual.tipo)}
          </p>
          <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-zinc-50">{atual.nome}</h2>
          {atual.generos?.length > 0 && (
            <p className="mt-1 truncate text-sm text-zinc-400">{atual.generos.join(' · ')}</p>
          )}
          <p className="mt-3 line-clamp-3 text-sm text-zinc-300">{atual.descricao}</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
            <span className="text-lg font-bold text-zinc-50">{formatPreco(atual.preco)}</span>
            <span className="inline-flex items-center gap-1 text-sm text-amber-300">
              <Star className="size-4 fill-current" aria-hidden="true" />
              {Number(atual.avaliacao).toFixed(1)}
            </span>
            <Link to={`/obras/${atual.id}`} className="btn-primary ml-auto px-4 py-2">
              Ver obra
            </Link>
          </div>
        </div>
      </div>

      {total > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10" onClick={() => ir(-1)} aria-label="Destaque anterior">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          {obras.map((obra, i) => (
            <button
              key={obra.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Mostrar destaque ${i + 1}: ${obra.nome}`}
              aria-current={i === indice % total ? 'true' : undefined}
              className={`h-2 rounded-full transition-all ${i === indice % total ? 'w-6 bg-brand-400' : 'w-2 bg-white/25 hover:bg-white/50'}`}
            />
          ))}
          <button type="button" className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10" onClick={() => ir(1)} aria-label="Próximo destaque">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          {!reduzMovimento && (
            <button
              type="button"
              className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10"
              onClick={() => setPausado((p) => !p)}
              aria-label={pausado ? 'Retomar rotação dos destaques' : 'Pausar rotação dos destaques'}
            >
              {pausado ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
