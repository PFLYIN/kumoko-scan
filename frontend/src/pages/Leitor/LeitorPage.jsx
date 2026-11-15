import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { catalogService } from '../../services/catalog.service.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatNumeroCapitulo } from '../../utils/format.js';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import LeitorNavegacao from './LeitorNavegacao.jsx';

// Leitor vertical: paginas em sequencia, com navegacao entre capitulos.
export default function LeitorPage() {
  const { id: obraId, capituloId } = useParams();

  const { data, loading, error, reload } = useFetch(async () => {
    const [obra, capitulos, paginas] = await Promise.all([
      catalogService.getObra(obraId),
      catalogService.listCapitulos(obraId),
      catalogService.listPaginas(capituloId),
    ]);
    return { obra, capitulos, paginas };
  }, [obraId, capituloId]);

  const capitulos = data?.capitulos ?? [];
  const indice = capitulos.findIndex((c) => String(c.id) === String(capituloId));
  const atual = capitulos[indice];
  const anterior = indice > 0 ? capitulos[indice - 1] : null;
  const proximo = indice >= 0 && indice < capitulos.length - 1 ? capitulos[indice + 1] : null;
  const tituloCapitulo = atual ? `Capítulo ${formatNumeroCapitulo(atual.numero)}` : 'Capítulo';

  useDocumentTitle(data?.obra ? `${data.obra.nome} - ${tituloCapitulo}` : 'Leitor');

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

  const { obra, paginas } = data;

  return (
    <div className="mx-auto max-w-4xl px-2 py-6 sm:px-4">
      <div className="mb-4 px-2">
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

      <LeitorNavegacao obraId={obra.id} anterior={anterior} proximo={proximo} />

      {paginas.length === 0 ? (
        <div className="my-8">
          <EmptyState
            icon={ImageOff}
            title="Capítulo sem páginas"
            description="As páginas deste capítulo ainda não foram enviadas."
          />
        </div>
      ) : (
        <ol className="my-6 flex flex-col items-center bg-black" aria-label="Páginas do capítulo">
          {paginas.map((pagina, i) => (
            <li key={pagina.id} className="w-full">
              <img
                src={pagina.imagemUrl}
                alt={`Página ${pagina.numero} de ${paginas.length}`}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="mx-auto block h-auto w-full max-w-3xl select-none"
              />
            </li>
          ))}
        </ol>
      )}

      <LeitorNavegacao obraId={obra.id} anterior={anterior} proximo={proximo} />
    </div>
  );
}
