import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingState from '../ui/LoadingState.jsx';

// Exige usuario autenticado; caso contrario manda para /entrar com retorno a pagina atual.
export default function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState message="Verificando sua sessão..." />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/entrar?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
