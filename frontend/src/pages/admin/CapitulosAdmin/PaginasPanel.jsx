import { useId, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  ImageOff,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { catalogService } from '../../../services/catalog.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../hooks/useToast.js';
import { IMAGE_ACCEPT, validateImageFile } from '../../../utils/validation.js';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';

// Ordena os arquivos pelo nome (001.jpg, 002.jpg...) para manter a ordem de leitura.
const porNome = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
const porNumero = (a, b) => a.numero - b.numero;

const STATUS_LABEL = { aguardando: 'Aguardando', enviando: 'Enviando', ok: 'Enviada', erro: 'Erro' };

function mover(lista, de, para) {
  if (para < 0 || para >= lista.length || de === para) return lista;
  const copia = [...lista];
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
}

let seq = 0;

export default function PaginasPanel({ capituloId, onTotalPaginas }) {
  const inputId = useId();
  const toast = useToast();
  const { data: paginas, loading, error, reload, mutate } = useFetch(
    () => catalogService.listPaginas(capituloId),
    [capituloId],
  );
  const [uploads, setUploads] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [atual, setAtual] = useState({ indice: 0, total: 0 });
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  // Ordem local ainda nao salva (null = igual a do servidor).
  const [ordem, setOrdem] = useState(null);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const [arrastando, setArrastando] = useState(null);
  const [alvo, setAlvo] = useState(null);

  const atualizarUpload = (key, patch) =>
    setUploads((atual) => atual.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  // O backend aceita 1 imagem por requisicao; varios arquivos sao enviados em sequencia.
  const enviar = async (itens) => {
    setEnviando(true);
    let ok = 0;
    let falhas = 0;
    let lista = paginas ?? [];
    for (const [i, item] of itens.entries()) {
      setAtual({ indice: i + 1, total: itens.length });
      atualizarUpload(item.key, { status: 'enviando', progresso: 0, erro: null });
      try {
        const pagina = await catalogService.uploadPagina(capituloId, item.file, undefined, {
          onProgress: (progresso) => atualizarUpload(item.key, { progresso }),
        });
        lista = [...lista, pagina].sort(porNumero);
        mutate(lista);
        atualizarUpload(item.key, { status: 'ok', progresso: 100 });
        ok += 1;
      } catch (err) {
        atualizarUpload(item.key, { status: 'erro', erro: err.message || 'Falha no envio.' });
        falhas += 1;
      }
    }
    setEnviando(false);
    onTotalPaginas(lista.length);
    // Uma nova pagina muda a lista: descarta uma reordenacao pendente.
    if (ok) setOrdem(null);
    if (falhas === 0) toast.success(`${ok} página(s) enviada(s).`);
    else
      toast.error(
        `${ok} página(s) enviada(s), ${falhas} com erro. Use "Tentar novamente" para reenviar as que falharam.`,
      );
  };

  const handleFiles = async (e) => {
    const arquivos = Array.from(e.target.files ?? []).sort(porNome);
    e.target.value = '';
    if (!arquivos.length) return;

    const invalido = arquivos.map(validateImageFile).find(Boolean);
    if (invalido) {
      toast.error(invalido);
      return;
    }
    const itens = arquivos.map((file) => ({
      key: `u${++seq}`,
      file,
      status: 'aguardando',
      progresso: 0,
      erro: null,
    }));
    setUploads(itens);
    await enviar(itens);
  };

  const tentarNovamente = () => enviar(uploads.filter((u) => u.status === 'erro'));

  const confirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await catalogService.deletePagina(paraExcluir.id);
      const restantes = (paginas ?? []).filter((p) => p.id !== paraExcluir.id);
      mutate(restantes);
      setOrdem(null);
      onTotalPaginas(restantes.length);
      toast.success(`Página ${paraExcluir.numero} excluída.`);
      setParaExcluir(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const exibidas = ordem ?? paginas ?? [];
  const alterada = Boolean(ordem) && ordem.some((p, i) => p.id !== paginas[i]?.id);

  const moverPara = (de, para) => {
    const nova = mover(exibidas, de, para);
    if (nova === exibidas) return;
    setOrdem(nova);
    setAnuncio(`Página ${exibidas[de].numero} movida para a posição ${para + 1} de ${nova.length}.`);
  };

  const salvarOrdem = async () => {
    setSalvandoOrdem(true);
    try {
      const salvas = await catalogService.reordenarPaginas(
        capituloId,
        exibidas.map((p) => p.id),
      );
      mutate([...salvas].sort(porNumero));
      setOrdem(null);
      toast.success('Ordem das páginas salva.');
      setAnuncio('Ordem das páginas salva.');
    } catch (err) {
      toast.error(err);
    } finally {
      setSalvandoOrdem(false);
    }
  };

  const onDrop = (e, indice) => {
    e.preventDefault();
    const de = arrastando ?? Number(e.dataTransfer.getData('text/plain'));
    setArrastando(null);
    setAlvo(null);
    if (Number.isInteger(de)) moverPara(de, indice);
  };

  if (loading) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-zinc-400">
        <Spinner className="size-4" /> Carregando páginas...
      </p>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Não foi possível carregar as páginas" />;

  const falhas = uploads.filter((u) => u.status === 'erro').length;
  const concluidas = uploads.filter((u) => u.status === 'ok').length;
  const ocupado = enviando || salvandoOrdem;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          onChange={handleFiles}
          disabled={ocupado}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className={`btn-primary peer-focus-visible:outline-2 peer-focus-visible:outline-brand-400 ${ocupado ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        >
          {enviando ? <Spinner className="size-4" /> : <Upload className="size-4" aria-hidden="true" />}
          {enviando ? `Enviando ${atual.indice} de ${atual.total}...` : 'Enviar páginas'}
        </label>
        <p className="text-xs text-zinc-500">JPG, PNG ou WEBP até 5 MB. Vários arquivos são enviados na ordem do nome.</p>
      </div>

      {uploads.length > 0 && (
        <section aria-label="Envio de páginas" className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-300" aria-live="polite">
              {concluidas} de {uploads.length} enviada(s)
              {falhas > 0 && <span className="text-red-400"> · {falhas} com erro</span>}
            </p>
            <div className="flex gap-2">
              {falhas > 0 && !enviando && (
                <button type="button" onClick={tentarNovamente} className="btn-secondary px-3 py-1.5 text-xs">
                  <RotateCcw className="size-3.5" aria-hidden="true" /> Tentar novamente ({falhas})
                </button>
              )}
              {!enviando && (
                <button
                  type="button"
                  onClick={() => setUploads([])}
                  className="btn-secondary px-3 py-1.5 text-xs"
                  aria-label="Fechar lista de envios"
                >
                  <X className="size-3.5" aria-hidden="true" /> Fechar
                </button>
              )}
            </div>
          </div>
          <ul className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
            {uploads.map((u) => (
              <li
                key={u.key}
                data-status={u.status}
                className="grid grid-cols-[minmax(0,1fr)_8rem_6rem] items-center gap-3 text-xs"
              >
                <span className="truncate text-zinc-300" title={u.file.name}>
                  {u.file.name}
                  {u.erro && <span className="block truncate text-red-400">{u.erro}</span>}
                </span>
                <span
                  role="progressbar"
                  aria-label={`Progresso de ${u.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={u.progresso}
                  className="h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <span
                    className={`block h-full transition-[width] ${u.status === 'erro' ? 'bg-red-500' : u.status === 'ok' ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${u.status === 'erro' ? 100 : u.progresso}%` }}
                  />
                </span>
                <span
                  className={`flex items-center gap-1 ${u.status === 'erro' ? 'text-red-400' : u.status === 'ok' ? 'text-emerald-400' : 'text-zinc-400'}`}
                >
                  {u.status === 'enviando' && <Spinner className="size-3" />}
                  {u.status === 'ok' && <CheckCircle2 className="size-3.5" aria-hidden="true" />}
                  {u.status === 'erro' && <AlertCircle className="size-3.5" aria-hidden="true" />}
                  {STATUS_LABEL[u.status]}
                  {u.status === 'enviando' && ` ${u.progresso}%`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {exibidas.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
          <ImageOff className="size-4" aria-hidden="true" /> Nenhuma página enviada para este capítulo.
        </p>
      ) : (
        <>
          {exibidas.length > 1 && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-zinc-500">
                Arraste as miniaturas ou use as setas para reordenar; depois clique em &quot;Salvar ordem&quot;.
              </p>
              {alterada && (
                <>
                  <button
                    type="button"
                    onClick={salvarOrdem}
                    disabled={ocupado}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    {salvandoOrdem ? <Spinner className="size-3.5" /> : <Save className="size-3.5" aria-hidden="true" />}
                    Salvar ordem
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrdem(null);
                      setAnuncio('Ordem original restaurada.');
                    }}
                    disabled={ocupado}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    Desfazer
                  </button>
                  <span className="text-xs text-amber-300">Ordem alterada (não salva)</span>
                </>
              )}
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {anuncio}
          </p>
          <ul aria-label="Ordem das páginas" className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {exibidas.map((pagina, indice) => (
              <li
                key={pagina.id}
                data-pagina-id={pagina.id}
                draggable={!ocupado}
                onDragStart={(e) => {
                  setArrastando(indice);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(indice));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (alvo !== indice) setAlvo(indice);
                }}
                onDragLeave={() => setAlvo((a) => (a === indice ? null : a))}
                onDrop={(e) => onDrop(e, indice)}
                onDragEnd={() => {
                  setArrastando(null);
                  setAlvo(null);
                }}
                className={`group relative cursor-grab overflow-hidden rounded-lg ring-1 active:cursor-grabbing ${alvo === indice && arrastando !== indice ? 'ring-2 ring-brand-400' : 'ring-white/10'} ${arrastando === indice ? 'opacity-50' : ''}`}
              >
                <img
                  src={pagina.imagemOtimizadaUrl || pagina.imagemUrl}
                  alt={`Página ${pagina.numero}`}
                  width={200}
                  height={300}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="aspect-[2/3] w-full bg-ink-800 object-cover"
                />
                <span className="absolute top-1 left-1 rounded bg-black/70 p-0.5 text-zinc-300" aria-hidden="true">
                  <GripVertical className="size-3.5" />
                </span>
                <span
                  className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-100"
                  data-testid="posicao-pagina"
                >
                  {indice + 1}
                </span>
                <span className="absolute right-1 bottom-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => moverPara(indice, indice - 1)}
                    disabled={indice === 0 || ocupado}
                    className="cursor-pointer rounded-md bg-black/70 p-1 text-zinc-200 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Mover página ${pagina.numero} para cima`}
                  >
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverPara(indice, indice + 1)}
                    disabled={indice === exibidas.length - 1 || ocupado}
                    className="cursor-pointer rounded-md bg-black/70 p-1 text-zinc-200 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Mover página ${pagina.numero} para baixo`}
                  >
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => setParaExcluir(pagina)}
                  disabled={alterada}
                  title={alterada ? 'Salve ou desfaça a nova ordem antes de excluir' : undefined}
                  className="absolute top-1 right-1 cursor-pointer rounded-md bg-black/70 p-1.5 text-zinc-300 opacity-100 hover:text-red-400 focus-visible:opacity-100 disabled:cursor-not-allowed sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Excluir página ${pagina.numero}`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
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
