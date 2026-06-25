import React from 'react';
import { Routes, Route } from 'react-router-dom';
// 🎯 Adicionei CriarLivro e EditarLivro na importação
import { Home, Manga, Livros, Auth, CriarManga, EditarManga, Capitulos, Perfil, CriarLivro, EditarLivro } from './pages';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manga" element={<Manga />} />
            <Route path="/manga/novo" element={<CriarManga />} />
            <Route path="/manga/:id/editar" element={<EditarManga />} />
            <Route path="/manga/:id/capitulos" element={<Capitulos />} />
            <Route path="/manga/:id/editar" element={<EditarManga />} />
            <Route path="/manga/editar/:id" element={<EditarManga />} />
            
            {/* 🎯 Rotas completas para o fluxo de Livros */}
            <Route path="/livros" element={<Livros />} />
            <Route path="/livro/novo" element={<CriarLivro />} />
            <Route path="/livro/editar/:id" element={<EditarLivro />} />
            
            <Route path="/login" element={<Auth />} />
            <Route path="/perfil" element={<Perfil />} />
        </Routes>
    );
}

export default AppRoutes;