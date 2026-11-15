import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const LIMITE = 320;

// Sinopse que recolhe textos longos (botao "Ler mais").
export default function Sinopse({ texto, vazio }) {
  const [aberta, setAberta] = useState(false);
  const longa = (texto?.length ?? 0) > LIMITE;
  return (
    <section aria-labelledby="sinopse">
      <h2 id="sinopse" className="mb-2 text-lg font-semibold text-zinc-100">
        Sinopse
      </h2>
      <p
        id="sinopse-texto"
        className={`max-w-prose text-[15px] leading-relaxed whitespace-pre-line text-zinc-300 ${longa && !aberta ? 'line-clamp-4' : ''}`}
      >
        {texto || vazio}
      </p>
      {longa && (
        <button
          type="button"
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          aria-controls="sinopse-texto"
          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-brand-300 hover:text-white"
        >
          {aberta ? 'Mostrar menos' : 'Ler mais'}
          <ChevronDown className={`size-4 transition-transform ${aberta ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
