import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from '../components/routing/ProtectedRoute.jsx';
import AdminRoute from '../components/routing/AdminRoute.jsx';
import RouteError from '../components/routing/RouteError.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import HomePage from '../pages/Home/HomePage.jsx';
import CatalogoPage from '../pages/Catalogo/CatalogoPage.jsx';
import ObraDetalhesPage from '../pages/ObraDetalhes/ObraDetalhesPage.jsx';
import CarrinhoPage from '../pages/Carrinho/CarrinhoPage.jsx';
import EntrarPage from '../pages/Entrar/EntrarPage.jsx';
import NotFoundPage from '../pages/NotFound/NotFoundPage.jsx';

// Carrega a pagina sob demanda (code splitting) para telas menos acessadas.
const lazyPage = (importer) => async () => {
  const module = await importer();
  return { Component: module.default };
};

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <LoadingState />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogoPage /> },
      { path: 'obras/:id', element: <ObraDetalhesPage /> },
      {
        path: 'obras/:id/capitulos/:capituloId',
        lazy: lazyPage(() => import('../pages/Leitor/LeitorPage.jsx')),
      },
      { path: 'carrinho', element: <CarrinhoPage /> },
      { path: 'entrar', element: <EntrarPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'pedidos', lazy: lazyPage(() => import('../pages/Pedidos/PedidosPage.jsx')) },
          { path: 'pedidos/:id', lazy: lazyPage(() => import('../pages/Pedidos/PedidoDetalhePage.jsx')) },
          { path: 'perfil', lazy: lazyPage(() => import('../pages/Perfil/PerfilPage.jsx')) },
        ],
      },
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          { index: true, element: <Navigate to="acervo" replace /> },
          { path: 'acervo', lazy: lazyPage(() => import('../pages/admin/Acervo/AcervoPage.jsx')) },
          { path: 'obras/nova', lazy: lazyPage(() => import('../pages/admin/ObraForm/ObraFormPage.jsx')) },
          { path: 'obras/:id/editar', lazy: lazyPage(() => import('../pages/admin/ObraForm/ObraFormPage.jsx')) },
          {
            path: 'obras/:id/capitulos',
            lazy: lazyPage(() => import('../pages/admin/CapitulosAdmin/CapitulosAdminPage.jsx')),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
