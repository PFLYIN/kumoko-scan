import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { catalogService } from '../../../services/catalog.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../hooks/useToast.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import LoadingState from '../../../components/ui/LoadingState.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import ObraEditor from './ObraEditor.jsx';

// Mesma pagina para /admin/obras/nova e /admin/obras/:id/editar.
export default function ObraFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle(editando ? 'Editar obra' : 'Nova obra');

  const { data: obra, loading, error, reload } = useFetch(
    () => (editando ? catalogService.getObra(id) : Promise.resolve(null)),
    [id ?? 'nova'],
  );

  const salvar = async (formData) => {
    const salva = editando ? await catalogService.updateObra(id, formData) : await catalogService.createObra(formData);
    toast.success(editando ? 'Obra atualizada.' : `"${salva.nome}" cadastrada no acervo.`);
    navigate(editando ? '/admin/acervo' : `/admin/obras/${salva.id}/capitulos`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/admin/acervo" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-brand-300">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao acervo
      </Link>
      <PageHeader
        title={editando ? 'Editar obra' : 'Nova obra'}
        subtitle={editando ? obra?.nome : 'Cadastre um mangá, livro ou light novel no catálogo.'}
      />

      {loading && <LoadingState message="Carregando obra..." />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && <ObraEditor key={obra?.id ?? 'nova'} obra={obra} onSalvar={salvar} />}
    </div>
  );
}
