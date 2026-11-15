import { Outlet, ScrollRestoration, useNavigation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function AppLayout() {
  // Indica carregamento de rotas lazy (chunks sob demanda).
  const navigation = useNavigation();
  const navegando = navigation.state !== 'idle';

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only z-[200] rounded-lg bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      {navegando && (
        <div className="fixed inset-x-0 top-0 z-[150] h-0.5 animate-pulse bg-gradient-to-r from-brand-500 to-accent-400" role="progressbar" aria-label="Carregando página" />
      )}
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
