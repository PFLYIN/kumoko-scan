import { Keyboard } from 'lucide-react';
import { LARGURAS_LEITOR, MODOS_LEITURA } from '../../utils/leitura.js';

const ATALHOS = [
  ['→ / ←', 'Próxima / anterior (página no modo página a página; capítulo na rolagem contínua)'],
  ['] / [', 'Próximo / anterior capítulo'],
  ['L', 'Alternar largura da leitura'],
];

// Preferencias do leitor (salvas no navegador) + indicador de pagina + ajuda de atalhos.
export default function LeitorToolbar({ prefs, onChange, pagina, totalPaginas }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-ink-850 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="leitor-modo" className="text-xs text-zinc-400">
          Modo
        </label>
        <select
          id="leitor-modo"
          value={prefs.modo}
          onChange={(e) => onChange({ modo: e.target.value })}
          className="field-input w-auto py-1.5"
        >
          {MODOS_LEITURA.map((m) => (
            <option key={m.value} value={m.value} className="bg-ink-800">
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="leitor-largura" className="text-xs text-zinc-400">
          Largura
        </label>
        <select
          id="leitor-largura"
          value={prefs.largura}
          onChange={(e) => onChange({ largura: e.target.value })}
          className="field-input w-auto py-1.5"
        >
          {LARGURAS_LEITOR.map((l) => (
            <option key={l.value} value={l.value} className="bg-ink-800">
              {l.label}
            </option>
          ))}
        </select>
      </div>
      {totalPaginas > 0 && (
        <p className="text-xs text-zinc-300" aria-live="polite">
          Página <strong>{pagina}</strong> de {totalPaginas}
        </p>
      )}
      <details className="relative ml-auto">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">
          <Keyboard className="size-4" aria-hidden="true" /> Atalhos
        </summary>
        <dl className="panel absolute right-0 z-20 mt-2 w-80 space-y-2 p-4 text-xs">
          {ATALHOS.map(([tecla, desc]) => (
            <div key={tecla} className="flex gap-3">
              <dt className="w-14 shrink-0">
                <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-zinc-100">{tecla}</kbd>
              </dt>
              <dd className="text-zinc-300">{desc}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
