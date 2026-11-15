import { X } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { catalogService } from '../../services/catalog.service.js';

const chave = (g) => g.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// Filtro por genero (botoes alternaveis; ?genero= na URL). Generos vem de GET /api/obras/generos.
export default function GeneroFiltro({ value, onChange }) {
  const { data, loading } = useFetch(() => catalogService.listGeneros(), []);
  const generos = data ?? [];
  if (loading) {
    return <div className="h-8 w-full max-w-2xl animate-pulse rounded-full bg-white/5" aria-hidden="true" />;
  }
  if (generos.length === 0) return null;
  const ativo = value ? chave(value) : '';

  return (
    <div role="group" aria-label="Filtrar por gênero" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Gêneros</span>
      {generos.map(({ genero, total }) => {
        const selecionado = chave(genero) === ativo;
        return (
          <button
            key={genero}
            type="button"
            aria-pressed={selecionado}
            onClick={() => onChange(selecionado ? '' : genero)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selecionado
                ? 'bg-accent-400 text-ink-950'
                : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-brand-400/40 hover:text-white'
            }`}
          >
            {genero} <span className={selecionado ? 'text-ink-900/70' : 'text-zinc-500'}>{total}</span>
          </button>
        );
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs text-zinc-400 hover:text-white"
        >
          <X className="size-3.5" aria-hidden="true" /> Limpar gênero
        </button>
      )}
    </div>
  );
}
