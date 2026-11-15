import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingState from '../ui/LoadingState.jsx';
import EmptyState from '../ui/EmptyState.jsx';

// Area administrativa: exige login e role "admin" (o backend tambem valida).
export default function AdminRoute() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState message="Verificando sua sessão..." />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/entrar?redirect=${redirect}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          description="Esta área é exclusiva para administradores do acervo."
          action={
            <Link to="/" className="btn-secondary">
              Voltar ao início
            </Link>
          }
        />
      </div>
    );
  }

  return <Outlet />;
}
