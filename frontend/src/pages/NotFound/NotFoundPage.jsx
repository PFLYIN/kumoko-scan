import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Compass className="size-14 text-brand-400" aria-hidden="true" />
      <p className="mt-6 text-sm font-semibold tracking-widest text-brand-300">ERRO 404</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Página não encontrada</h1>
      <p className="mt-3 text-sm text-zinc-400">O endereço que você acessou não existe ou foi movido.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">
          Ir para o início
        </Link>
        <Link to="/catalogo" className="btn-secondary">
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
