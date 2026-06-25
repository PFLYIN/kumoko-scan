import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../service/api';
import './Livro.css';

function Livro() {
  const [livros, setLivros] = useState([]);

  useEffect(() => {
    buscarLivros();
  }, []);

  const buscarLivros = async () => {
    try {
      const res = await api.get('/livros');
      setLivros(res.data);
    } catch (error) {
      console.error("Erro ao buscar livros:", error);
    }
  };

  // 🎯 NOVO: Função para Excluir
  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        await api.delete(`/livros/${id}`);
        setLivros(livros.filter(livro => livro.id !== id));
        alert('Livro excluído com sucesso!');
      } catch (error) {
        alert('Erro ao excluir livro.');
      }
    }
  };

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
                <img src={livro.capa_url} alt={livro.nome} className="img-capa" />
              ) : (
                <div className="sem-capa">Sem Capa</div>
              )}
            </div>

            <div className="card-content">
              <h3>{livro.nome}</h3>
              {/* 🎯 NOVO: Botões de Ação */}
              <div className="card-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <Link to={`/livro/editar/${livro.id}`} className="btn-editar" style={{ background: '#4CAF50', color: '#fff', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>Editar</Link>
                <button onClick={() => handleExcluir(livro.id)} className="btn-excluir" style={{ background: '#f44336', color: '#fff', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Livro;