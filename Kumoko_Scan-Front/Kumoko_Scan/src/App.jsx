import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './componentes/Header/Header';
import Home from './pages/Home/Home';
import { Manga, CriarManga, Capitulos } from './pages/Manga';
import { Livro, CriarLivro } from './pages/Livro';
import Auth from './pages/Cadastro/Auth';
import Perfil from './pages/Perfil';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mangas" element={<Manga />} />
          <Route path="/manga/novo" element={<CriarManga />} />
          <Route path="/manga/:mangaId/capitulos" element={<Capitulos />} />
          <Route path="/livros" element={<Livro />} />
          <Route path="/livro/novo" element={<CriarLivro />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;