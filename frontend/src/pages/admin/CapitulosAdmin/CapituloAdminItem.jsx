import { useState } from 'react';
import { ChevronDown, Images, Pencil, Trash2 } from 'lucide-react';
import { formatData, formatNumeroCapitulo } from '../../../utils/format.js';
import CapituloForm from './CapituloForm.jsx';
import PaginasPanel from './PaginasPanel.jsx';

export default function CapituloAdminItem({ capitulo, onAtualizar, onExcluir, onTotalPaginas }) {
  const [editando, setEditando] = useState(false);
  const [paginasAbertas, setPaginasAbertas] = useState(false);
  const panelId = `paginas-capitulo-${capitulo.id}`;

  return (
    <li className="panel p-4">
      {editando ? (
        <CapituloForm
          numeroInicial={capitulo.numero}
          tituloInicial={capitulo.titulo ?? ''}
          submitLabel="Salvar"
          onSubmit={async (dados) => {
            await onAtualizar(dados);
            setEditando(false);
          }}
          onCancel={() => setEditando(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-zinc-100">
              Capítulo {formatNumeroCapitulo(capitulo.numero)}
              {capitulo.titulo && <span className="font-normal text-zinc-400"> - {capitulo.titulo}</span>}
            </p>
            <p className="text-xs text-zinc-500">
              {capitulo.totalPaginas} página(s) - criado em {formatData(capitulo.criadoEm)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary px-3 py-2"
              onClick={() => setPaginasAbertas((v) => !v)}
              aria-expanded={paginasAbertas}
              aria-controls={panelId}
            >
              <Images className="size-4" aria-hidden="true" /> Páginas
              <ChevronDown
                className={`size-4 transition-transform ${paginasAbertas ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            <button type="button" className="btn-secondary px-3 py-2" onClick={() => setEditando(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Editar
            </button>
            <button type="button" className="btn-danger px-3 py-2" onClick={onExcluir}>
              <Trash2 className="size-4" aria-hidden="true" /> Excluir
            </button>
          </div>
        </div>
      )}

      {paginasAbertas && (
        <div id={panelId} className="mt-4 border-t border-white/5 pt-4">
          <PaginasPanel capituloId={capitulo.id} onTotalPaginas={onTotalPaginas} />
        </div>
      )}
    </li>
  );
}
