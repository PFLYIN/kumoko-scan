import { useId, useState } from 'react';
import { ImageOff, Trash2, Upload } from 'lucide-react';
import { catalogService } from '../../../services/catalog.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../hooks/useToast.js';
import { IMAGE_ACCEPT, validateImageFile } from '../../../utils/validation.js';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';

// Ordena os arquivos pelo nome (001.jpg, 002.jpg...) para manter a ordem de leitura.
const porNome = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });

export default function PaginasPanel({ capituloId, onTotalPaginas }) {
  const inputId = useId();
  const toast = useToast();
  const { data: paginas, loading, error, reload, mutate } = useFetch(
    () => catalogService.listPaginas(capituloId),
    [capituloId],
  );
  const [progresso, setProgresso] = useState(null);
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // O backend aceita 1 imagem por requisicao; varios arquivos sao enviados em sequencia.
  const handleFiles = async (e) => {
    const arquivos = Array.from(e.target.files ?? []).sort(porNome);
    e.target.value = '';
    if (!arquivos.length) return;

    const invalido = arquivos.map(validateImageFile).find(Boolean);
    if (invalido) {
      toast.error(invalido);
      return;
    }

    let lista = paginas ?? [];
    let enviadas = 0;
    try {
      for (const [i, arquivo] of arquivos.entries()) {
        setProgresso({ atual: i + 1, total: arquivos.length });
        const pagina = await catalogService.uploadPagina(capituloId, arquivo);
        lista = [...lista, pagina].sort((a, b) => a.numero - b.numero);
        mutate(lista);
        enviadas += 1;
      }
      toast.success(`${enviadas} página(s) enviada(s).`);
    } catch (err) {
      toast.error(enviadas ? `${enviadas} página(s) enviada(s). Falha na seguinte: ${err.message}` : err);
    } finally {
      setProgresso(null);
      onTotalPaginas(lista.length);
    }
  };

  const confirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await catalogService.deletePagina(paraExcluir.id);
      const restantes = (paginas ?? []).filter((p) => p.id !== paraExcluir.id);
      mutate(restantes);
      onTotalPaginas(restantes.length);
      toast.success(`Página ${paraExcluir.numero} excluída.`);
      setParaExcluir(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-zinc-400">
        <Spinner className="size-4" /> Carregando páginas...
      </p>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Não foi possível carregar as páginas" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          onChange={handleFiles}
          disabled={Boolean(progresso)}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className={`btn-primary peer-focus-visible:outline-2 peer-focus-visible:outline-brand-400 ${progresso ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        >
          {progresso ? <Spinner className="size-4" /> : <Upload className="size-4" aria-hidden="true" />}
          {progresso ? `Enviando ${progresso.atual} de ${progresso.total}...` : 'Enviar páginas'}
        </label>
        <p className="text-xs text-zinc-500">JPG, PNG ou WEBP até 5 MB. Vários arquivos são enviados na ordem do nome.</p>
      </div>

      {paginas.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
          <ImageOff className="size-4" aria-hidden="true" /> Nenhuma página enviada para este capítulo.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {paginas.map((pagina) => (
            <li key={pagina.id} className="group relative overflow-hidden rounded-lg ring-1 ring-white/10">
              <img
                src={pagina.imagemUrl}
                alt={`Página ${pagina.numero}`}
                loading="lazy"
                className="aspect-[2/3] w-full bg-ink-800 object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-100">
                {pagina.numero}
              </span>
              <button
                type="button"
                onClick={() => setParaExcluir(pagina)}
                className="absolute top-1 right-1 cursor-pointer rounded-md bg-black/70 p-1.5 text-zinc-300 opacity-100 hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Excluir página ${pagina.numero}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(paraExcluir)}
        title="Excluir página?"
        description={paraExcluir ? `A página ${paraExcluir.numero} será removida permanentemente.` : ''}
        confirmLabel="Excluir"
        danger
        loading={excluindo}
        onConfirm={confirmarExclusao}
        onCancel={() => setParaExcluir(null)}
      />
    </div>
  );
}
