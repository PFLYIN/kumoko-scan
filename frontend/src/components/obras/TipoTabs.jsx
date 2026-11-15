import { TIPOS_OBRA } from '../../utils/format.js';

const OPCOES = [{ value: '', plural: 'Todos' }, ...TIPOS_OBRA];

// Filtro por tipo de obra (tabs controladas pelo parametro ?tipo= da URL).
export default function TipoTabs({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Tipo de obra" className="flex flex-wrap gap-2">
      {OPCOES.map((opcao) => {
        const ativo = (value ?? '') === opcao.value;
        return (
          <button
            key={opcao.value || 'todos'}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(opcao.value)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              ativo
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            {opcao.plural}
          </button>
        );
      })}
    </div>
  );
}
