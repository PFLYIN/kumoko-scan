import { useId, useState } from 'react';
import { X } from 'lucide-react';

const MAX_GENEROS = 8; // limite do catalog-service
const MAX_GENERO_LEN = 30;
const MIN_GENERO_LEN = 2;

const normalizar = (g) => g.trim().replace(/\s+/g, ' ');

// Campo de tags: Enter ou virgula adiciona, Backspace no campo vazio remove o ultimo.
export default function GenerosInput({ value, onChange, sugestoes = [], disabled = false }) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState(null);

  const adicionar = (bruto) => {
    const novos = bruto.split(',').map(normalizar).filter(Boolean);
    let lista = [...value];
    for (const g of novos) {
      if (g.length < MIN_GENERO_LEN || g.length > MAX_GENERO_LEN) {
        setErro(`Cada gênero tem de ${MIN_GENERO_LEN} a ${MAX_GENERO_LEN} caracteres.`);
        return;
      }
      if (lista.some((x) => x.toLowerCase() === g.toLowerCase())) continue;
      if (lista.length >= MAX_GENEROS) {
        setErro(`Máximo de ${MAX_GENEROS} gêneros.`);
        break;
      }
      lista = [...lista, g];
    }
    setErro(null);
    onChange(lista);
    setTexto('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (texto.trim()) adicionar(texto);
    } else if (e.key === 'Backspace' && !texto && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const restantes = sugestoes.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        Gêneros
      </label>
      <div className={`field-input flex flex-wrap items-center gap-1.5 py-1.5 ${disabled ? 'opacity-50' : ''}`}>
        {value.map((g) => (
          <span key={g} className="inline-flex items-center gap-1 rounded-full bg-brand-600/25 px-2 py-0.5 text-xs text-brand-200">
            {g}
            <button type="button" disabled={disabled} className="cursor-pointer" aria-label={`Remover gênero ${g}`} onClick={() => onChange(value.filter((x) => x !== g))}>
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          disabled={disabled}
          className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none"
          placeholder={value.length ? '' : 'Ex.: Ação, Fantasia (Enter para adicionar)'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => texto.trim() && adicionar(texto)}
        />
      </div>
      {erro && <p className="text-xs text-red-400" role="alert">{erro}</p>}
      {!disabled && restantes.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label="Sugestões de gêneros">
          {restantes.slice(0, 10).map((s) => (
            <button key={s} type="button" className="cursor-pointer rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-brand-400/50 hover:text-brand-300" onClick={() => adicionar(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
