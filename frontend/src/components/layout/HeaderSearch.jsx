import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { formatPreco, tipoLabel } from '../../utils/format.js';
import ObraCover from '../obras/ObraCover.jsx';
import Spinner from '../ui/Spinner.jsx';

const DEBOUNCE_MS = 250;
const MIN_CARACTERES = 2;

// Busca global com sugestoes (GET /api/obras?busca=&limit=5). Enter sem sugestao ativa abre /catalogo?busca=.
export default function HeaderSearch({ className = '', onSearch }) {
  const [termo, setTermo] = useState('');
  const [resultado, setResultado] = useState({ termo: '', obras: [], total: 0 });
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const navigate = useNavigate();
  const listId = useId();
  const wrapperRef = useRef(null);

  const busca = termo.trim();
  const pronto = busca.length >= MIN_CARACTERES;
  const carregando = pronto && resultado.termo !== busca;
  const sugestoes = pronto && resultado.termo === busca ? resultado.obras : [];

  // Debounce: so consulta a API depois que o usuario para de digitar.
  useEffect(() => {
    if (!pronto) return undefined;
    let ativoReq = true;
    const timer = window.setTimeout(() => {
      catalogService
        .listObras({ busca, limit: 5, page: 1 })
        .then((res) => ativoReq && setResultado({ termo: busca, obras: res.data ?? [], total: res.meta?.total ?? 0 }))
        .catch(() => ativoReq && setResultado({ termo: busca, obras: [], total: 0 }));
    }, DEBOUNCE_MS);
    return () => {
      ativoReq = false;
      window.clearTimeout(timer);
    };
  }, [busca, pronto]);

  // Fecha ao clicar fora.
  useEffect(() => {
    const onDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const fechar = () => {
    setAberto(false);
    setAtivo(-1);
  };

  const irParaObra = (obra) => {
    fechar();
    setTermo('');
    navigate(`/obras/${obra.id}`);
    onSearch?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (aberto && ativo >= 0 && sugestoes[ativo]) {
      irParaObra(sugestoes[ativo]);
      return;
    }
    fechar();
    navigate(busca ? `/catalogo?busca=${encodeURIComponent(busca)}` : '/catalogo');
    onSearch?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      fechar();
      return;
    }
    if (!sugestoes.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => (i + 1) % sugestoes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
    }
  };

  const mostrarPainel = aberto && pronto;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form role="search" onSubmit={handleSubmit} className="relative">
        <label htmlFor="busca-global" className="sr-only">
          Buscar obras
        </label>
        <input
          id="busca-global"
          type="search"
          autoComplete="off"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setAberto(true);
            setAtivo(-1);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={mostrarPainel && ativo >= 0 ? `${listId}-${ativo}` : undefined}
          placeholder="Buscar obras..."
          className="w-full rounded-full border border-white/10 bg-white/5 py-2 pr-10 pl-4 text-sm text-zinc-100 placeholder-zinc-400 transition-all focus:border-brand-400/60 focus:bg-white/10 focus:outline-none md:w-56 md:focus:w-72"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-brand-300"
          aria-label="Buscar"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      </form>

      {mostrarPainel && (
        <div className="panel absolute right-0 z-50 mt-2 w-96 overflow-hidden bg-ink-800 p-1">
          {carregando && (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-400" role="status">
              <Spinner className="size-4" /> Buscando...
            </p>
          )}
          {!carregando && sugestoes.length === 0 && (
            <p className="px-3 py-3 text-sm text-zinc-400" role="status">
              Nenhuma obra encontrada para &quot;{busca}&quot;.
            </p>
          )}
          {!carregando && sugestoes.length > 0 && (
            <>
              <ul id={listId} role="listbox" aria-label="Sugestões de obras">
                {sugestoes.map((obra, i) => (
                  <li
                    key={obra.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === ativo}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => irParaObra(obra)}
                    onMouseEnter={() => setAtivo(i)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 ${i === ativo ? 'bg-white/10' : ''}`}
                  >
                    <ObraCover
                      src={obra.capaThumbUrl ?? obra.capaUrl}
                      alt=""
                      titulo={obra.nome}
                      className="aspect-[2/3] w-9 shrink-0 rounded"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-100">{obra.nome}</span>
                      <span className="block truncate text-xs text-zinc-400">
                        {tipoLabel(obra.tipo)}
                        {obra.autor ? ` - ${obra.autor}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-zinc-200">{formatPreco(obra.preco)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSubmit}
                className="mt-1 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-semibold text-brand-300 hover:bg-white/10"
              >
                Ver todos os {resultado.total} resultado(s) para &quot;{busca}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
