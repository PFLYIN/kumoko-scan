import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

// Fallback de erro inesperado na renderizacao/carregamento de rotas (inclui chunk lazy que falhou).
export default function RouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div role="alert" className="panel max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto size-12 text-red-400" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-zinc-100">
          {status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Ocorreu um erro inesperado ao exibir esta página. Recarregue ou volte para o início.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
          <Link to="/" className="btn-primary" reloadDocument>
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
