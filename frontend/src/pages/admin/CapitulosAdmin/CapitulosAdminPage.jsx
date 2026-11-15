import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Pencil } from 'lucide-react';
import { catalogService } from '../../../services/catalog.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../hooks/useToast.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { formatNumeroCapitulo, tipoTemCapitulos } from '../../../utils/format.js';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import LoadingState from '../../../components/ui/LoadingState.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import CapituloForm from './CapituloForm.jsx';
import CapituloAdminItem from './CapituloAdminItem.jsx';

const ordenarPorNumero = (lista) => [...lista].sort((a, b) => Number(a.numero) - Number(b.numero));

export default function CapitulosAdminPage() {
  const { id: obraId } = useParams();
  const toast = useToast();
  const obraQuery = useFetch(() => catalogService.getObra(obraId), [obraId]);
  const capQuery = useFetch(() => catalogService.listCapitulos(obraId), [obraId]);
  const obra = obraQuery.data;
  const capitulos = capQuery.data ?? [];
  useDocumentTitle(obra ? `Capítulos - ${obra.nome}` : 'Capítulos');

  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const proximoNumero = capitulos.length ? Math.floor(Math.max(...capitulos.map((c) => Number(c.numero)))) + 1 : 1;

  const criar = async (dados) => {
    const novo = await catalogService.createCapitulo(obraId, dados);
    capQuery.mutate((lista = []) => ordenarPorNumero([...lista, novo]));
    toast.success(`Capítulo ${formatNumeroCapitulo(novo.numero)} criado. Agora envie as páginas.`);
  };

  const atualizar = async (capituloId, dados) => {
    const atualizado = await catalogService.updateCapitulo(capituloId, dados);
    capQuery.mutate((lista = []) => ordenarPorNumero(lista.map((c) => (c.id === capituloId ? atualizado : c))));
    toast.success('Capítulo atualizado.');
  };

  // Mantem o contador de paginas da lista em dia apos upload/exclusao de paginas.
  const atualizarTotalPaginas = (capituloId, totalPaginas) => {
    capQuery.mutate((lista = []) => lista.map((c) => (c.id === capituloId ? { ...c, totalPaginas } : c)));
  };

  const confirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await catalogService.deleteCapitulo(paraExcluir.id);
      capQuery.mutate((lista = []) => lista.filter((c) => c.id !== paraExcluir.id));
      toast.success(`Capítulo ${formatNumeroCapitulo(paraExcluir.numero)} excluído.`);
      setParaExcluir(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  if (obraQuery.loading) return <LoadingState message="Carregando obra..." />;
  if (obraQuery.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={obraQuery.error} onRetry={obraQuery.reload} />
      </div>
    );
  }

  if (!tipoTemCapitulos(obra.tipo)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={BookOpen}
          title="Livros não têm capítulos"
          description={`"${obra.nome}" é um livro: ele é vendido como edição completa, sem leitura online. Para publicar capítulos, mude o tipo para mangá ou light novel.`}
          action={
            <Link to={`/admin/obras/${obra.id}/editar`} className="btn-secondary">
              <Pencil className="size-4" aria-hidden="true" /> Editar obra
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 2xl:max-w-6xl">
      <Link to="/admin/acervo" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-brand-300">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao acervo
      </Link>
      <PageHeader
        title="Capítulos"
        subtitle={obra.nome}
        actions={
          <>
            <Link to={`/admin/obras/${obra.id}/editar`} className="btn-secondary">
              <Pencil className="size-4" aria-hidden="true" /> Editar obra
            </Link>
            <Link to={`/obras/${obra.id}`} className="btn-secondary">
              Ver página pública
            </Link>
          </>
        }
      />

      <section aria-labelledby="novo-capitulo" className="panel mb-8 p-5">
        <h2 id="novo-capitulo" className="mb-4 font-semibold text-zinc-100">
          Novo capítulo
        </h2>
        <CapituloForm key={proximoNumero} numeroInicial={proximoNumero} submitLabel="Adicionar capítulo" onSubmit={criar} />
      </section>

      {capQuery.loading && <LoadingState message="Carregando capítulos..." />}
      {!capQuery.loading && capQuery.error && <ErrorState error={capQuery.error} onRetry={capQuery.reload} />}
      {!capQuery.loading && !capQuery.error && capitulos.length === 0 && (
        <EmptyState icon={BookOpen} title="Nenhum capítulo cadastrado" description="Crie o primeiro capítulo acima." />
      )}
      {!capQuery.loading && !capQuery.error && capitulos.length > 0 && (
        <ul className="flex flex-col gap-3">
          {capitulos.map((cap) => (
            <CapituloAdminItem
              key={cap.id}
              capitulo={cap}
              onAtualizar={(dados) => atualizar(cap.id, dados)}
              onExcluir={() => setParaExcluir(cap)}
              onTotalPaginas={(total) => atualizarTotalPaginas(cap.id, total)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(paraExcluir)}
        title="Excluir capítulo?"
        description={
          paraExcluir
            ? `O capítulo ${formatNumeroCapitulo(paraExcluir.numero)} e todas as suas páginas serão removidos permanentemente.`
            : ''
        }
        confirmLabel="Excluir"
        danger
        loading={excluindo}
        onConfirm={confirmarExclusao}
        onCancel={() => setParaExcluir(null)}
      />
    </div>
  );
}
