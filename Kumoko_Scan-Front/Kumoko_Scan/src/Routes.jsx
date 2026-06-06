import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home, Manga, Livros, Auth, CriarManga, EditarManga, Capitulos, Perfil } from './pages';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manga" element={<Manga />} />
            <Route path="/manga/novo" element={<CriarManga />} />
            <Route path="/manga/:id/editar" element={<EditarManga />} />
            <Route path="/manga/:id/capitulos" element={<Capitulos />} />
            <Route path="/livros" element={<Livros />} />
            <Route path="/login" element={<Auth />} />
             <Route path="/perfil" element={<Perfil />} />
        </Routes>
    );
}

export default AppRoutes;