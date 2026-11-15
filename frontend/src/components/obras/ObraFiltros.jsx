import { useState } from 'react';
import { Search } from 'lucide-react';
import { ORDENACOES } from '../../utils/format.js';

// Busca + ordenacao. O pai passa key={busca} para reiniciar o campo quando a URL muda.
export default function ObraFiltros({ busca, ordenar, onBusca, onOrdenar }) {
  const [termo, setTermo] = useState(busca);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        role="search"
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          onBusca(termo.trim());
        }}
      >
        <label htmlFor="catalogo-busca" className="sr-only">
          Buscar no catálogo
        </label>
        <input
          id="catalogo-busca"
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por nome ou autor"
          className="field-input pr-10 sm:w-64"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-500 hover:text-brand-400"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      </form>

      <div className="flex items-center gap-2">
        <label htmlFor="catalogo-ordenar" className="text-xs whitespace-nowrap text-zinc-400">
          Ordenar por
        </label>
        <select
          id="catalogo-ordenar"
          value={ordenar}
          onChange={(e) => onOrdenar(e.target.value)}
          className="field-input py-2 sm:w-44"
        >
          {ORDENACOES.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-800">
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
