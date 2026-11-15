import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImageOff, RotateCcw } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useProgressoDaObra } from '../../hooks/useLeitura.js';
import { formatNumeroCapitulo } from '../../utils/format.js';
import {
  LARGURAS_LEITOR,
  lerPreferenciasLeitor,
  salvarPreferenciasLeitor,
  salvarProgresso,
} from '../../utils/leitura.js';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import LeitorNavegacao from './LeitorNavegacao.jsx';
import LeitorToolbar from './LeitorToolbar.jsx';

const ehCampo = (el) => /input|textarea|select/i.test(el?.tagName ?? '') || el?.isContentEditable;

// Pre-carrega as primeiras paginas do proximo capitulo (cache do navegador + Redis da API).
function preCarregarCapitulo(capituloId) {
  catalogService
    .listPaginas(capituloId)
    .then((paginas) => {
      paginas.slice(0, 3).forEach((p) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = p.imagemOtimizadaUrl || p.imagemUrl;
      });
    })
    .catch(() => {});
}

// Leitor: rolagem continua ou pagina a pagina, com progresso salvo e atalhos de teclado.
export default function LeitorPage() {
  const { id: obraId, capituloId } = useParams();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(lerPreferenciasLeitor);
  const progressoSalvo = useProgressoDaObra(obraId);
  // Progresso como estava ao abrir o capitulo (o salvamento automatico nao apaga o "retomar").
  const [inicial, setInicial] = useState({ capituloId, progresso: progressoSalvo });
  if (inicial.capituloId !== capituloId) setInicial({ capituloId, progresso: progressoSalvo });
  const paginaRetomavel =
    inicial.capituloId === capituloId &&
    inicial.progresso &&
    String(inicial.progresso.capituloId) === String(capituloId) &&
    inicial.progresso.pagina > 1
      ? inicial.progresso.pagina
      : null;

  const { data, loading, error, reload } = useFetch(async () => {
    const [obra, capitulos, paginas] = await Promise.all([
      catalogService.getObra(obraId),
      catalogService.listCapitulos(obraId),
      catalogService.listPaginas(capituloId),
    ]);
    return { obra, capitulos, paginas };
  }, [obraId, capituloId]);

  const capitulos = data?.capitulos ?? [];
  const paginas = data?.paginas ?? [];
  const totalPaginas = paginas.length;
  const indice = capitulos.findIndex((c) => String(c.id) === String(capituloId));
  const atual = capitulos[indice];
  const anterior = indice > 0 ? capitulos[indice - 1] : null;
  const proximo = indice >= 0 && indice < capitulos.length - 1 ? capitulos[indice + 1] : null;
  const tituloCapitulo = atual ? `Capítulo ${formatNumeroCapitulo(atual.numero)}` : 'Capítulo';
  const paginado = prefs.modo === 'paginado';

  // Pagina atual (1-based) por capitulo: trocar de capitulo volta para a 1 sem precisar de efeito.
  const [posicao, setPosicao] = useState({ capituloId: null, pagina: 1 });
  // No modo paginado o capitulo abre direto na pagina salva.
  const paginaInicial = paginado && paginaRetomavel ? Math.min(paginaRetomavel, totalPaginas || 1) : 1;
  const paginaAtual = posicao.capituloId === capituloId ? posicao.pagina : paginaInicial;
  const setPagina = useCallback((p) => setPosicao({ capituloId, pagina: p }), [capituloId]);

  // Rolagem continua: a pagina atual e a ultima cujo topo passou do meio da tela.
  const listaRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);
  useEffect(() => {
    if (paginado || totalPaginas === 0) return undefined;
    let frame = 0;
    const medir = () => {
      frame = 0;
      const lista = listaRef.current;
      if (!lista) return;
      const itens = lista.querySelectorAll(':scope > li');
      const meio = window.innerHeight / 2;
      let pagina = 1;
      itens.forEach((li, i) => {
        if (li.getBoundingClientRect().top < meio) pagina = i + 1;
      });
      const rect = lista.getBoundingClientRect();
      const percorrido = Math.min(Math.max(window.innerHeight - rect.top, 0), rect.height);
      setScrollPct(rect.height > 0 ? Math.round((percorrido / rect.height) * 100) : 0);
      setPagina(pagina);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [paginado, totalPaginas, setPagina, capituloId]);

  // Salva o progresso (obra, capitulo e pagina) neste navegador.
  useEffect(() => {
    if (!data?.obra || !atual) return;
    // Abriu e ainda nao saiu da pagina 1: mantem a posicao salva anteriormente (ver "Retomar").
    if (paginaRetomavel && paginaAtual === 1) return;
    salvarProgresso({
      obraId: String(data.obra.id),
      nome: data.obra.nome,
      tipo: data.obra.tipo,
      capaThumbUrl: data.obra.capaThumbUrl ?? data.obra.capaUrl ?? null,
      capituloId: String(atual.id),
      capituloNumero: atual.numero,
      pagina: Math.min(paginaAtual, totalPaginas || 1),
      totalPaginas,
    });
  }, [data, atual, paginaAtual, totalPaginas, paginaRetomavel]);

  // Pre-carrega o proximo capitulo quando o leitor passa da metade deste.
  const preCarregado = useRef(null);
  useEffect(() => {
    if (!proximo || preCarregado.current === proximo.id) return;
    const metade = totalPaginas === 0 || paginaAtual >= Math.ceil(totalPaginas / 2);
    if (metade) {
      preCarregado.current = proximo.id;
      preCarregarCapitulo(proximo.id);
    }
  }, [proximo, paginaAtual, totalPaginas]);

  const irPara = useCallback(
    (capitulo) => {
      if (capitulo) navigate(`/obras/${obraId}/capitulos/${capitulo.id}`);
    },
    [navigate, obraId],
  );

  const avancar = useCallback(() => {
    if (paginado && paginaAtual < totalPaginas) {
      setPagina(paginaAtual + 1);
      window.scrollTo({ top: 0 });
    } else irPara(proximo);
  }, [paginado, paginaAtual, totalPaginas, proximo, irPara, setPagina]);

  const voltar = useCallback(() => {
    if (paginado && paginaAtual > 1) {
      setPagina(paginaAtual - 1);
      window.scrollTo({ top: 0 });
    } else irPara(anterior);
  }, [paginado, paginaAtual, anterior, irPara, setPagina]);

  // Atalhos: setas (pagina no modo paginado; capitulo na rolagem continua), [ e ] (capitulo), L (largura).
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || ehCampo(e.target)) return;
      if (e.key === 'ArrowRight') avancar();
      else if (e.key === 'ArrowLeft') voltar();
      else if (e.key === ']') irPara(proximo);
      else if (e.key === '[') irPara(anterior);
      else if (e.key === 'l' || e.key === 'L') {
        setPrefs((p) => {
          const i = LARGURAS_LEITOR.findIndex((l) => l.value === p.largura);
          const next = { ...p, largura: LARGURAS_LEITOR[(i + 1) % LARGURAS_LEITOR.length].value };
          salvarPreferenciasLeitor(next);
          return next;
        });
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [avancar, voltar, irPara, proximo, anterior]);

  useDocumentTitle(data?.obra ? `${data.obra.nome} - ${tituloCapitulo}` : 'Leitor');

  const mudarPrefs = (mudanca) => {
    setPrefs((p) => {
      const next = { ...p, ...mudanca };
      salvarPreferenciasLeitor(next);
      return next;
    });
  };

  if (loading) return <LoadingState message="Carregando capítulo..." />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          error={error}
          title={error.status === 404 ? 'Capítulo não encontrado' : 'Não foi possível abrir o capítulo'}
          onRetry={error.status === 404 ? undefined : reload}
        />
      </div>
    );
  }

  const { obra } = data;
  const larguraClasse = LARGURAS_LEITOR.find((l) => l.value === prefs.largura)?.className ?? 'max-w-3xl';
  const progressoPct = totalPaginas === 0 ? 0 : paginado ? Math.round((paginaAtual / totalPaginas) * 100) : scrollPct;
  const retomarPagina = !paginado && paginaRetomavel && paginaAtual === 1 ? Math.min(paginaRetomavel, totalPaginas) : null;
  const paginaVisivel = paginas[Math.min(paginaAtual, totalPaginas) - 1];

  return (
    <div className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div
        className="fixed inset-x-0 top-0 z-[60] h-1 bg-white/5"
        role="progressbar"
        aria-label="Progresso no capítulo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressoPct}
      >
        <div className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-[width]" style={{ width: `${progressoPct}%` }} />
      </div>

      <div className={`mx-auto mb-4 px-2 ${larguraClasse}`}>
        <Link
          to={`/obras/${obra.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-brand-300"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {obra.nome}
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-50">
          {tituloCapitulo}
          {atual?.titulo && <span className="font-normal text-zinc-400"> - {atual.titulo}</span>}
        </h1>
      </div>

      <div className={`mx-auto ${larguraClasse}`}>
        <LeitorToolbar
          prefs={prefs}
          onChange={mudarPrefs}
          pagina={Math.min(paginaAtual, Math.max(totalPaginas, 1))}
          totalPaginas={totalPaginas}
        />
        <LeitorNavegacao obraId={obra.id} anterior={anterior} proximo={proximo} />
      </div>

      {retomarPagina && (
        <div className={`mx-auto mt-4 px-2 ${larguraClasse}`}>
          <button
            type="button"
            className="btn-secondary w-full border-brand-400/30 text-brand-300"
            onClick={() => {
              const itens = listaRef.current?.querySelectorAll(':scope > li') ?? [];
              itens[retomarPagina - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Retomar da página {retomarPagina}
          </button>
        </div>
      )}

      {totalPaginas === 0 ? (
        <div className="my-8">
          <EmptyState
            icon={ImageOff}
            title="Capítulo sem páginas"
            description="As páginas deste capítulo ainda não foram enviadas."
          />
        </div>
      ) : paginado ? (
        <div className="my-6">
          <ol className="flex flex-col items-center bg-black" aria-label="Páginas do capítulo">
            <li className={`relative w-full ${larguraClasse}`}>
              <img
                key={paginaVisivel.id}
                src={paginaVisivel.imagemOtimizadaUrl || paginaVisivel.imagemUrl}
                alt={`Página ${paginaVisivel.numero} de ${totalPaginas}`}
                width={1200}
                height={1800}
                decoding="async"
                className="mx-auto block h-auto w-full select-none"
              />
              {/* Metades clicaveis: esquerda volta, direita avanca. */}
              <button type="button" className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize" onClick={voltar} aria-label="Página anterior" />
              <button type="button" className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize" onClick={avancar} aria-label="Próxima página" />
            </li>
          </ol>
          {/* Pre-carrega a proxima pagina do mesmo capitulo. */}
          {paginas[paginaAtual] && (
            <link rel="preload" as="image" href={paginas[paginaAtual].imagemOtimizadaUrl || paginas[paginaAtual].imagemUrl} />
          )}
        </div>
      ) : (
        <ol ref={listaRef} className="my-6 flex flex-col items-center bg-black" aria-label="Páginas do capítulo">
          {paginas.map((pagina, i) => (
            <li key={pagina.id} className={`w-full ${larguraClasse}`}>
              {/* Versao WebP otimizada (max 1200px); width/height reservam espaco 2:3 ate a imagem carregar. */}
              <img
                src={pagina.imagemOtimizadaUrl || pagina.imagemUrl}
                alt={`Página ${pagina.numero} de ${totalPaginas}`}
                width={1200}
                height={1800}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="mx-auto block h-auto w-full select-none"
              />
              {pagina.imagemOtimizadaUrl && pagina.imagemOtimizadaUrl !== pagina.imagemUrl && (
                <a
                  href={pagina.imagemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-2 py-1 text-right text-[11px] text-zinc-500 hover:text-brand-300"
                >
                  ver original
                </a>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className={`mx-auto ${larguraClasse}`}>
        <LeitorNavegacao obraId={obra.id} anterior={anterior} proximo={proximo} />
      </div>
    </div>
  );
}
