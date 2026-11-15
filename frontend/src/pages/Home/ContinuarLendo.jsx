import { Link } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
import { useHistoricoLeitura } from '../../hooks/useLeitura.js';
import { removerProgresso } from '../../utils/leitura.js';
import { formatNumeroCapitulo } from '../../utils/format.js';
import ObraCover from '../../components/obras/ObraCover.jsx';

// "Continuar lendo": ultimas obras abertas no leitor (progresso salvo neste navegador).
export default function ContinuarLendo() {
  const historico = useHistoricoLeitura().slice(0, 6);
  if (historico.length === 0) return null;

  return (
    <section aria-labelledby="shelf-continuar" className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 2xl:max-w-[96rem]">
      <div className="mb-6 flex items-center gap-4">
        <span className="h-px w-8 bg-brand-500/60" aria-hidden="true" />
        <h2 id="shelf-continuar" className="text-lg font-light tracking-[0.2em] text-zinc-200 uppercase">
          Continuar lendo
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {historico.map((r) => {
          const pct = r.totalPaginas > 0 ? Math.round((Math.min(r.pagina, r.totalPaginas) / r.totalPaginas) * 100) : 0;
          return (
            <li key={r.obraId} className="panel group relative flex gap-4 p-3 transition-colors hover:border-brand-400/30">
              <ObraCover
                src={r.capaThumbUrl}
                alt=""
                titulo={r.nome}
                className="aspect-[2/3] w-16 shrink-0 rounded-lg ring-1 ring-white/10"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="truncate pr-6 font-medium text-zinc-100">{r.nome}</p>
                <p className="text-xs text-zinc-400">
                  Capítulo {formatNumeroCapitulo(r.capituloNumero)}
                  {r.totalPaginas > 0 && ` - página ${Math.min(r.pagina, r.totalPaginas)} de ${r.totalPaginas}`}
                </p>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label={`Progresso no capítulo de ${r.nome}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                >
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${pct}%` }} />
                </div>
                <Link
                  to={`/obras/${r.obraId}/capitulos/${r.capituloId}`}
                  className="mt-1 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-300 after:absolute after:inset-0 hover:text-white"
                  aria-label={`Continuar ${r.nome}, capítulo ${formatNumeroCapitulo(r.capituloNumero)}`}
                >
                  <BookOpen className="size-4" aria-hidden="true" /> Continuar
                </Link>
              </div>
              <button
                type="button"
                onClick={() => removerProgresso(r.obraId)}
                className="absolute top-2 right-2 z-10 rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                aria-label={`Remover ${r.nome} de continuar lendo`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
