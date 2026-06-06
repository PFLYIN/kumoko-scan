import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../service/api';
import './Livro.css';

function Livro() {
  const [livros, setLivros] = useState([]);

  useEffect(() => {
    const buscarLivros = async () => {
      try {
        const res = await api.get('/livros');
        setLivros(res.data);
      } catch (error) {
        console.error("Erro ao buscar livros:", error);
      }
    };
    buscarLivros();
  }, []);

  return (
    <div className="container-catalogo-livros">
      <div className="catalog-header">
        <div>
          <h2>Biblioteca de Livros</h2>
          <p className="catalog-subtitle">Explore sua coleção de livros e gerencie leituras de forma organizada.</p>
        </div>

        <Link to="/livro/novo" className="btn-acao">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Criar Livro
        </Link>
      </div>

      <div className="grid-livros">
        {livros.map(livro => (
          <div key={livro.id} className="card-livro">
            <div className="card-image-wrap">
              {livro.capa_url ? (
                <img
                  src={`http://localhost:3000/files/${livro.capa_url.replace(/\\/g, '/').split('uploads/')[1]}`}
                  alt={livro.nome}
                  className="img-capa"
                />
              ) : (
                <div className="sem-capa">Sem Capa</div>
              )}
            </div>

            <div className="card-content">
              <h3>{livro.nome}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Livro;